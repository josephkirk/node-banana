"use client";

import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useWorkflowStore } from "@/store/workflowStore";
import { FloatInputNodeData } from "@/types";
import { useShowHandleLabels } from "@/hooks/useShowHandleLabels";
import { HandleLabel } from "./HandleLabel";
import { Rotator, SliderUI, SpinnerUI } from "./InputControls";

type FloatInputNodeType = Node<FloatInputNodeData, "floatInput">;

export function FloatInputNode({ id, data, selected }: NodeProps<FloatInputNodeType>) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const showLabels = useShowHandleLabels(selected);

  const [isEditingName, setIsEditingName] = useState(false);
  const [localName, setLocalName] = useState(data.variableName || "");

  const handleValueChange = useCallback(
    (val: number, loop = false) => {
      const range = data.max - data.min;
      let processed = val;
      
      if (loop && range > 0) {
        // Smooth looping modulo
        processed = (((val - data.min) % range) + range) % range + data.min;
      } else {
        processed = Math.min(data.max, Math.max(data.min, val));
      }

      const stepped = Math.round(processed / data.step) * data.step;
      // Fixed to precision of step
      const precision = (data.step.toString().split(".")[1] || "").length;
      const final = parseFloat(stepped.toFixed(precision));
      updateNodeData(id, { value: final });
    },
    [id, data.min, data.max, data.step, updateNodeData]
  );

  const handleNameBlur = useCallback(() => {
    setIsEditingName(false);
    updateNodeData(id, { variableName: localName || undefined });
  }, [id, localName, updateNodeData]);

  return (
    <BaseNode
      id={id}
      selected={selected}
      className="min-w-[200px]"
      settingsPanel={<FloatInputSettings id={id} data={data} />}
    >
      <div className="flex flex-col gap-3 py-2">
        {/* Header / Name */}
        <div className="flex items-center justify-between px-1">
          {isEditingName ? (
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleNameBlur}
              autoFocus
              className="bg-neutral-900 border border-blue-500 rounded px-1.5 py-0.5 text-[11px] text-white w-full focus:outline-none"
            />
          ) : (
            <div 
              className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider cursor-text hover:text-blue-400 transition-colors flex items-center gap-1"
              onClick={() => setIsEditingName(true)}
            >
              {data.variableName ? `@${data.variableName}` : "Set Variable Name"}
              <svg className="w-3 h-3 opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          )}
        </div>

        {/* Display Interaction */}
        <div className="flex-1 flex items-center justify-center min-h-[60px]">
          {data.displayType === "slider" && (
            <SliderUI
              value={data.value}
              min={data.min}
              max={data.max}
              step={data.step}
              onChange={handleValueChange}
            />
          )}

          {data.displayType === "spinner" && (
            <SpinnerUI
              value={data.value}
              min={data.min}
              max={data.max}
              step={data.step}
              onChange={handleValueChange}
            />
          )}

          {data.displayType === "rotator" && (
            <Rotator
              value={data.value}
              min={data.min}
              max={data.max}
              step={data.step}
              onChange={handleValueChange}
            />
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="value"
        data-handletype="text"
      />
      <HandleLabel label="Value" side="source" color="var(--handle-color-text)" visible={showLabels} />
    </BaseNode>
  );
}

function FloatInputSettings({ id, data }: { id: string; data: FloatInputNodeData }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  return (
    <div className="space-y-4 p-3 bg-neutral-800/50 border-t border-neutral-700">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-neutral-500 uppercase font-bold mb-1">Display</label>
          <select
            value={data.displayType}
            onChange={(e) => updateNodeData(id, { displayType: e.target.value as any })}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
          >
            <option value="slider">Slider</option>
            <option value="spinner">Spinner</option>
            <option value="rotator">Rotator</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-neutral-500 uppercase font-bold mb-1">Step</label>
          <input
            type="number"
            value={data.step}
            onChange={(e) => updateNodeData(id, { step: parseFloat(e.target.value) || 0.1 })}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-neutral-500 uppercase font-bold mb-1">Min</label>
          <input
            type="number"
            value={data.min}
            onChange={(e) => updateNodeData(id, { min: parseFloat(e.target.value) || 0 })}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
          />
        </div>
        <div>
          <label className="block text-[10px] text-neutral-500 uppercase font-bold mb-1">Max</label>
          <input
            type="number"
            value={data.max}
            onChange={(e) => updateNodeData(id, { max: parseFloat(e.target.value) || 100 })}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
          />
        </div>
      </div>
    </div>
  );
}
