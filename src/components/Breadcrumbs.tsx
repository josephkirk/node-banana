"use client";

import React, { useMemo } from "react";
import { useWorkflowStore } from "@/store/workflowStore";
import { useShallow } from "zustand/shallow";

export function Breadcrumbs() {
  const { navigationStack, nodes, diveOut } = useWorkflowStore(
    useShallow((state) => ({
      navigationStack: state.navigationStack,
      nodes: state.nodes,
      diveOut: state.diveOut,
    }))
  );

  // Resolve names for the stack
  const path = useMemo(() => {
    const result = [{ id: "root", name: "Root" }];
    
    navigationStack.forEach((level, index) => {
      // Find the subflow node in the parent state (the level before this one)
      const parentNodes = index === 0 
        ? nodes // Root level nodes
        : navigationStack[index - 1].nodes;
        
      const parentNode = parentNodes.find(n => n.id === level.parentId);
      const name = (parentNode?.data as SubFlowNodeData)?.name || `Subflow ${index + 1}`;
      
      result.push({ id: level.parentId, name });
    });
    
    return result;
  }, [navigationStack, nodes]);

  if (navigationStack.length === 0) return null;

  return (
    <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-neutral-800/90 backdrop-blur-sm border border-neutral-700 px-3 py-1.5 rounded-full shadow-lg">
      {path.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && <span className="text-neutral-600">/</span>}
          <button
            onClick={() => {
              // Pop until we reach this level
              const popsNeeded = navigationStack.length - index;
              for (let i = 0; i < popsNeeded; i++) {
                diveOut();
              }
            }}
            className={`text-xs font-medium transition-colors ${
              index === path.length - 1
                ? "text-white cursor-default"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            {item.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
