"use client";

import React, { useCallback } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useWorkflowStore } from "@/store/workflowStore";
import { SubFlowNodeData, WorkflowNode, NodeType } from "@/types";
import { useShowHandleLabels } from "@/hooks/useShowHandleLabels";
import { HandleLabel } from "./HandleLabel";
import { NODE_LABELS } from "@/utils/nodeLabels";

type SubFlowNodeType = Node<SubFlowNodeData, "subflow">;

export function SubFlowNode({ id, data, selected }: NodeProps<SubFlowNodeType>) {
  const diveIn = useWorkflowStore((state) => state.diveIn);
  const showLabels = useShowHandleLabels(selected);

  const handleDoubleClick = useCallback(() => {
    diveIn(id);
  }, [id, diveIn]);

  const { inputs, outputs } = data.interfaceMapping;
  const inputKeys = Object.keys(inputs);
  const outputKeys = Object.keys(outputs);

  const resolveLabel = useCallback((handleId: string, mapping: { nodeId: string; handleId: string }) => {
    const internalNode = data.subgraph?.nodes.find((n: WorkflowNode) => n.id === mapping.nodeId);
    if (!internalNode) return handleId;

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

  return (
    <BaseNode
      id={id}
      selected={selected}
      contentClassName="flex flex-col items-center justify-center p-4 bg-neutral-900/60"
      onDoubleClick={handleDoubleClick}
    >
      {/* Dynamic Input Handles */}
      {inputKeys.map((handleId, index) => {
        const top = `${((index + 1) * 100) / (inputKeys.length + 1)}%`;
        const label = resolveLabel(handleId, inputs[handleId]);
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

      {/* Dynamic Output Handles */}
      {outputKeys.map((handleId, index) => {
        const top = `${((index + 1) * 100) / (outputKeys.length + 1)}%`;
        const label = resolveLabel(handleId, outputs[handleId]);
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

      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        
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
    </BaseNode>
  );
}
