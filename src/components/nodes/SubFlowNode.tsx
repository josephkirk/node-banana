"use client";

import React, { useCallback, useMemo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useWorkflowStore } from "@/store/workflowStore";
import { SubFlowNodeData, WorkflowNode, NodeType } from "@/types";
import { useShowHandleLabels } from "@/hooks/useShowHandleLabels";
import { HandleLabel } from "./HandleLabel";
import { NODE_LABELS } from "@/utils/nodeLabels";
import { Rotator, SliderUI, SpinnerUI } from "./InputControls";
import debounce from "lodash/debounce";

type SubFlowNodeType = Node<SubFlowNodeData, "subflow">;

export function SubFlowNode({ id, data, selected }: NodeProps<SubFlowNodeType>) {
  const diveIn = useWorkflowStore((state) => state.diveIn);
  const executeWorkflow = useWorkflowStore((state) => state.executeWorkflow);
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const updateSubFlowInternalNodeData = useWorkflowStore((state) => state.updateSubFlowInternalNodeData);
  const showLabels = useShowHandleLabels(selected);

  const handleDoubleClick = useCallback(() => {
    diveIn(id);
  }, [id, diveIn]);

  const { inputs, outputs } = data.interfaceMapping;
  const inputKeys = Object.keys(inputs);
  const outputKeys = Object.keys(outputs);

  const resolveLabel = useCallback((mapping: { nodeId: string; handleId: string }) => {
    const internalNode = data.subgraph?.nodes.find((n: WorkflowNode) => n.id === mapping.nodeId);
    if (!internalNode) return mapping.handleId;

    const nodeData = internalNode.data as any;

    // 1. Use variableName if it exists (custom user label for prompts/floats)
    if (nodeData.variableName) {
      return nodeData.variableName;
    }

    // 2. Use custom name or title if it exists
    if (nodeData.name || nodeData.customTitle) {
      return nodeData.name || nodeData.customTitle;
    }

    // 3. Use specific handle name if it's not generic
    if (mapping.handleId && !["default", "text", "image", "video", "audio", "value", "target", "source"].includes(mapping.handleId)) {
      return mapping.handleId;
    }

    // 4. Fallback to standard node labels
    return NODE_LABELS[internalNode.type as NodeType] || internalNode.type;
  }, [data.subgraph]);

  // Debounced execution to prevent rapid API calls
  const debouncedExecute = useMemo(
    () => debounce((nodeId: string) => executeWorkflow(nodeId), 250),
    [executeWorkflow]
  );

  // Preview Detector: Find the first node with media, prioritizing mapped outputs
  const previewNode = useMemo(() => {
    if (!data.subgraph) return null;
    
    // Check nodes mapped in outputs first
    for (const mapping of Object.values(outputs)) {
      const node = data.subgraph.nodes.find(n => n.id === mapping.nodeId);
      const nd = node?.data as any;
      if (nd && (nd.outputImage || nd.image || nd.video || nd.outputVideo || nd.outputAudio)) {
        return node;
      }
    }
    
    // Fallback to first node with any media
    return data.subgraph.nodes.find(n => {
      const nd = n.data as any;
      return nd && (nd.outputImage || nd.image || nd.video || nd.outputVideo || nd.outputAudio);
    });
  }, [data.subgraph, outputs]);

  const previewMedia = previewNode ? (
    (previewNode.data as any).outputImage || 
    (previewNode.data as any).image || 
    (previewNode.data as any).video || 
    (previewNode.data as any).outputVideo || 
    (previewNode.data as any).outputAudio
  ) : null;

  // Sync previewMedia to store so ControlPanel can access it for template saving
  React.useEffect(() => {
    if (previewMedia && previewMedia !== data.previewMedia) {
      updateNodeData(id, { previewMedia });
    }
  }, [previewMedia, id, data.previewMedia, updateNodeData]);

  // Find all internal nodes that should have exposed controls
  // Currently we support floatInput nodes. We prioritize those mapped in inputs.
  const controlNodes = useMemo(() => {
    if (!data.subgraph) return [];
    
    // Get all floatInput nodes from subgraph
    const floatNodes = data.subgraph.nodes.filter(n => n.type === "floatInput");
    
    // Return with their labels
    return floatNodes.map(node => ({
      node,
      label: resolveLabel({ nodeId: node.id, handleId: "value" })
    }));
  }, [data.subgraph, resolveLabel]);

  return (
    <BaseNode
      id={id}
      selected={selected}
      contentClassName="flex flex-col items-center p-0 bg-neutral-900/80 overflow-hidden"
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex flex-col items-center gap-2 py-4 px-4 w-full">
        <div className="text-center">
          <div className="text-sm font-bold text-white mb-0.5">{data.name}</div>
          <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">
            {data.isLinked ? "Linked Workflow" : "Inline Subflow"}
          </div>
        </div>
        
        <button
          onClick={handleDoubleClick}
          className="mt-1 px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-bold rounded-full transition-colors flex items-center gap-1.5 border border-neutral-700"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
          DIVE IN
        </button>
      </div>

      {/* Square Preview Container */}
      {previewMedia && (
        <div className="w-full aspect-square bg-neutral-950 flex items-center justify-center overflow-hidden border-t border-neutral-800">
          {/* Support both image and video previews */}
          {previewMedia.startsWith('data:video') || previewMedia.includes('.mp4') ? (
            <video src={previewMedia} className="w-full h-full object-cover" autoPlay muted loop />
          ) : (
            <img src={previewMedia} alt="Preview" className="w-full h-full object-cover" />
          )}
        </div>
      )}

      {/* Interactive Control Surface for internal input nodes */}
      <div className="w-full flex flex-col border-t border-neutral-800">
        {controlNodes.map(({ node, label }) => {
          const nodeData = node.data as any;
          
          const onChange = (val: number) => {
            updateSubFlowInternalNodeData(id, node.id, { value: val });
            debouncedExecute(id);
          };

          return (
            <div key={node.id} className="w-full p-2 border-b border-neutral-800 last:border-0 bg-neutral-900/40">
              <div className="text-[9px] text-neutral-500 font-bold uppercase mb-1.5 truncate" title={label}>{label}</div>
              <div className="flex items-center justify-center">
                {nodeData.displayType === "slider" && (
                  <SliderUI 
                    value={nodeData.value} 
                    min={nodeData.min} 
                    max={nodeData.max} 
                    step={nodeData.step} 
                    onChange={onChange} 
                    showValue={false} 
                  />
                )}
                {nodeData.displayType === "spinner" && (
                  <SpinnerUI 
                    value={nodeData.value} 
                    min={nodeData.min} 
                    max={nodeData.max} 
                    step={nodeData.step} 
                    onChange={onChange} 
                    showValue={false} 
                  />
                )}
                {nodeData.displayType === "rotator" && (
                  <Rotator 
                    value={nodeData.value} 
                    min={nodeData.min} 
                    max={nodeData.max} 
                    step={nodeData.step} 
                    onChange={onChange} 
                    showValue={false} 
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input handles */}
      {inputKeys.map((handleId, index) => {
        const top = `${((index + 1) * 100) / (inputKeys.length + 1)}%`;
        const label = resolveLabel(inputs[handleId]);
        return (
          <React.Fragment key={handleId}>
            <Handle
              type="target"
              position={Position.Left}
              id={handleId}
              data-handletype={inputs[handleId].type}
              style={{ top }}
            />
            <HandleLabel 
              label={label} 
              side="target" 
              color={`var(--handle-color-${inputs[handleId].type})`} 
              visible={showLabels}
              top={top}
            />
          </React.Fragment>
        );
      })}

      {/* Output handles */}
      {outputKeys.map((handleId, index) => {
        const top = `${((index + 1) * 100) / (outputKeys.length + 1)}%`;
        const label = resolveLabel(outputs[handleId]);
        return (
          <React.Fragment key={handleId}>
            <Handle
              type="source"
              position={Position.Right}
              id={handleId}
              data-handletype={outputs[handleId].type}
              style={{ top }}
            />
            <HandleLabel 
              label={label} 
              side="source" 
              color={`var(--handle-color-${outputs[handleId].type})`} 
              visible={showLabels}
              top={top}
            />
          </React.Fragment>
        );
      })}
    </BaseNode>
  );
}
