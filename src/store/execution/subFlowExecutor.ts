/**
 * Sub-flow Executor
 * 
 * Recursively executes a nested graph within a SubFlow node.
 */

import { WorkflowNode, WorkflowEdge, SubFlowNodeData, WorkflowNodeData, NodeStatus } from "@/types";
import { NodeExecutionContext } from "./types";
import { groupNodesByLevel, chunk } from "../utils/executionUtils";
import { getSourceOutput, getConnectedInputsPure } from "../utils/connectedInputs";
import { useWorkflowStore } from "../workflowStore";
import * as Executors from "./index";

/**
 * Sub-flow Executor
 * 
 * Recursively executes a nested graph within a SubFlow node.
 */
export async function executeSubFlow(ctx: NodeExecutionContext): Promise<void> {
  const { node, getConnectedInputs, updateNodeData, signal } = ctx;
  const data = node.data as SubFlowNodeData;
  const subgraph = data.subgraph;

  if (!subgraph || !subgraph.nodes || subgraph.nodes.length === 0) {
    updateNodeData(node.id, { status: "complete" });
    return;
  }

  const { maxConcurrentCalls } = useWorkflowStore.getState();

  try {
    updateNodeData(node.id, { status: "loading", error: null });

    const internalNodes = [...subgraph.nodes];
    const internalEdges = [...subgraph.edges];
    const { interfaceMapping } = data;

    // 1. Map external inputs to internal node data
    const externalInputs = getConnectedInputs(node.id);
    
    // For each exposed input, find the value from the parent and inject it into the internal node
    Object.entries(interfaceMapping.inputs).forEach(([externalHandleId, mapping]) => {
      // Find the source value from the parent node's connected inputs
      const { images, text, videos, audio } = externalInputs;
      
      // Determine which value to use based on type
      let value: string | null = null;
      if (mapping.type === 'text') value = text;
      else if (mapping.type === 'image') value = images[0] || null;
      else if (mapping.type === 'video') value = videos[0] || null;
      else if (mapping.type === 'audio') value = audio[0] || null;

      if (value !== null) {
        const targetNode = internalNodes.find(n => n.id === mapping.nodeId);
        if (targetNode) {
          // Special handling for node types that don't use standard data fields
          if (targetNode.type === 'prompt') (targetNode.data as any).prompt = value;
          else if (targetNode.type === 'imageInput') (targetNode.data as any).image = value;
          else if (targetNode.type === 'videoInput') (targetNode.data as any).video = value;
          else if (targetNode.type === 'audioInput') (targetNode.data as any).audioFile = value;
          else if (targetNode.type === 'floatInput') (targetNode.data as any).value = parseFloat(value);
          else (targetNode.data as any).image = value; // Fallback
        }
      }
    });

    // 2. Execute internal levels
    const levels = groupNodesByLevel(internalNodes, internalEdges);
    
    for (const level of levels) {
      if (signal.aborted) break;

      const levelNodes = level.nodeIds
        .map(id => internalNodes.find(n => n.id === id))
        .filter((n): n is WorkflowNode => !!n);

      // Execute nodes in parallel batches
      const batches = chunk(levelNodes, maxConcurrentCalls);
      for (const batch of batches) {
        await Promise.all(batch.map(async (intNode) => {
          // Build execution context for internal node
          const intCtx: NodeExecutionContext = {
            ...ctx,
            node: intNode,
            getConnectedInputs: (id) => getConnectedInputsPure(id, internalNodes, internalEdges),
            updateNodeData: (id, newData) => {
              const target = internalNodes.find(n => n.id === id);
              if (target) Object.assign(target.data, newData);
            }
          };

          // Execute by type using registry
          const type = intNode.type as string;
          const execKey = `execute${type.charAt(0).toUpperCase() + type.slice(1)}`;
          const executor = (Executors as any)[execKey];
          if (executor) await executor(intCtx);
        }));
      }
    }

    // 3. Map internal outputs back to parent node data
    const outputData: Partial<SubFlowNodeData> = { status: "complete", error: null };
    
    Object.entries(interfaceMapping.outputs).forEach(([externalHandleId, mapping]) => {
      const sourceNode = internalNodes.find(n => n.id === mapping.nodeId);
      if (sourceNode) {
        const { value } = getSourceOutput(sourceNode, mapping.handleId);
        if (value) {
          // Store output in parent node data so downstream can consume it
          // We'll need to update SubFlowNodeData to hold output values
          (outputData as any)[`output_${externalHandleId}`] = value;
        }
      }
    });

    // Update the subgraph data in the main store to reflect execution results
    updateNodeData(node.id, {
      ...outputData,
      subgraph: { nodes: internalNodes, edges: internalEdges }
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    updateNodeData(node.id, { status: "error", error: message });
    throw err;
  }
}
