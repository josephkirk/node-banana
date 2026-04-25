"use client";

import { useWorkflowStore } from "@/store/workflowStore";
import { WorkflowNode } from "@/types";
import { useShallow } from "zustand/shallow";
import { useEffect, useRef } from "react";

interface CanvasContextMenuProps {
  x: number;
  y: number;
  node: WorkflowNode | null;
  onClose: () => void;
}

export function CanvasContextMenu({ x, y, node, onClose }: CanvasContextMenuProps) {
  const { navigationStack, exposeHandle } = useWorkflowStore(
    useShallow((state) => ({
      navigationStack: state.navigationStack,
      exposeHandle: state.exposeHandle,
    }))
  );

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!node) return null;

  const isInSubflow = navigationStack.length > 0;
  
  // Only allow exposing handles for certain node types
  const canExposeAsInput = ["imageInput", "videoInput", "audioInput", "prompt", "floatInput"].includes(node.type || "");
  const canExposeAsOutput = ["output"].includes(node.type || "");

  if (!isInSubflow || (!canExposeAsInput && !canExposeAsOutput)) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {canExposeAsInput && (
        <button
          onClick={() => {
            const isFloat = node.type === "floatInput";
            const handleId = node.type === "prompt" ? "text" : isFloat ? "value" : "image";
            const type = node.type === "prompt" ? "text" : isFloat ? "text" : "image";
            exposeHandle(node.id, handleId, "input", type);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:bg-blue-600 hover:text-white transition-colors"
        >
          Expose as Subflow Input
        </button>
      )}
      {canExposeAsOutput && (
        <button
          onClick={() => {
            exposeHandle(node.id, "image", "output", "image"); // Simplified
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:bg-blue-600 hover:text-white transition-colors"
        >
          Expose as Subflow Output
        </button>
      )}
    </div>
  );
}
