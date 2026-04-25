"use client";

import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useWorkflowStore } from "@/store/workflowStore";
import { FloatInputNodeData } from "@/types";
import { useShowHandleLabels } from "@/hooks/useShowHandleLabels";
import { HandleLabel } from "./HandleLabel";

type FloatInputNodeType = Node<FloatInputNodeData, "floatInput">;

export function FloatInputNode({ id, data, selected }: NodeProps<FloatInputNodeType>) {
  const nodeData = data;
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const showLabels = useShowHandleLabels(selected);

  const [isEditingName, setIsEditingName] = useState(false);
  const [localName, setLocalPrompt] = useState(nodeData.variableName || "");

  const handleValueChange = useCallback(
    (val: number, loop = false) => {
      const range = nodeData.max - nodeData.min;
      let processed = val;
      
      if (loop && range > 0) {
        // Smooth looping modulo
        processed = (((val - nodeData.min) % range) + range) % range + nodeData.min;
      } else {
        processed = Math.min(nodeData.max, Math.max(nodeData.min, val));
      }

      const stepped = Math.round(processed / nodeData.step) * nodeData.step;
      // Fixed to precision of step
      const precision = (nodeData.step.toString().split(".")[1] || "").length;
      const final = parseFloat(stepped.toFixed(precision));
      updateNodeData(id, { value: final });
    },
    [id, nodeData.min, nodeData.max, nodeData.step, updateNodeData]
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
      settingsPanel={<FloatInputSettings id={id} data={nodeData} />}
    >
      <div className="flex flex-col gap-3 py-2">
        {/* Header / Name */}
        <div className="flex items-center justify-between px-1">
          {isEditingName ? (
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalPrompt(e.target.value)}
              onBlur={handleNameBlur}
              autoFocus
              className="bg-neutral-900 border border-blue-500 rounded px-1.5 py-0.5 text-[11px] text-white w-full focus:outline-none"
            />
          ) : (
            <div 
              className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider cursor-text hover:text-blue-400 transition-colors flex items-center gap-1"
              onClick={() => setIsEditingName(true)}
            >
              {nodeData.variableName ? `@${nodeData.variableName}` : "Set Variable Name"}
              <svg className="w-3 h-3 opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          )}
        </div>

        {/* Display Interaction */}
        <div className="flex-1 flex items-center justify-center min-h-[60px]">
          {nodeData.displayType === "slider" && (
            <div className="w-full space-y-2">
               <input
                type="range"
                min={nodeData.min}
                max={nodeData.max}
                step={nodeData.step}
                value={nodeData.value}
                onChange={(e) => handleValueChange(parseFloat(e.target.value))}
                className="nodrag nopan w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="text-center font-mono text-xs text-white">
                {nodeData.value}
              </div>
            </div>
          )}

          {nodeData.displayType === "spinner" && (
            <div className="flex items-center gap-2">
               <button 
                 onClick={() => handleValueChange(nodeData.value - nodeData.step)}
                 className="nodrag nopan p-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-white"
               >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M20 12H4" strokeWidth={2} /></svg>
               </button>
               <input
                 type="number"
                 value={nodeData.value}
                 onChange={(e) => handleValueChange(parseFloat(e.target.value))}
                 className="nodrag nopan w-20 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-center text-sm text-white focus:outline-none focus:border-blue-500"
               />
               <button 
                 onClick={() => handleValueChange(nodeData.value + nodeData.step)}
                 className="nodrag nopan p-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-white"
               >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2} /></svg>
               </button>
            </div>
          )}

          {nodeData.displayType === "rotator" && (
            <Rotator 
              value={nodeData.value} 
              min={nodeData.min} 
              max={nodeData.max} 
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

function Rotator({ value, min, max, onChange }: { value: number, min: number, max: number, onChange: (val: number, loop?: boolean) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track cumulative rotation in degrees for visual smoothness
  const [visualRotation, setVisualRotation] = useState(() => {
    const percent = (value - min) / (max - min);
    return percent * 360;
  });

  // Shortest-path update to visual rotation to avoid backward flips when state updates externally
  const syncVisualRotation = useCallback((targetAngle: number) => {
    setVisualRotation(prev => {
      const diff = (targetAngle - (prev % 360) + 540) % 360 - 180;
      return prev + diff;
    });
  }, []);

  // Sync visual rotation when not dragging or when value changes significantly
  useEffect(() => {
    if (!isDragging) {
      const range = max - min;
      if (range === 0) return;
      const target = ((value - min) / range) * 360;
      syncVisualRotation(target);
    }
  }, [value, min, max, isDragging, syncVisualRotation]);

  const updateValueFromEvent = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    
    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    
    // Update local visual rotation immediately for zero-lag feeling
    syncVisualRotation(angle);

    // Map 0-360 degrees to min-max range and notify parent with loop=true
    const range = max - min;
    const newValue = min + (angle / 360) * range;
    onChange(newValue, true);
  }, [min, max, onChange, syncVisualRotation]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateValueFromEvent(e.clientX, e.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateValueFromEvent(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, updateValueFromEvent]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        ref={containerRef}
        className="nodrag nopan relative w-12 h-12 rounded-full bg-neutral-700 border-2 border-neutral-600 cursor-crosshair shadow-inner flex items-center justify-center group"
        onMouseDown={handleMouseDown}
      >
        <div 
          className="absolute w-1 h-5 bg-blue-500 rounded-full origin-bottom -translate-y-2.5 transition-transform duration-75"
          style={{ transform: `rotate(${visualRotation}deg)` }}
        />
        <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full z-10" />
        
        {/* Subtle clock ticks */}
        {[0, 90, 180, 270].map(tick => (
          <div 
            key={tick}
            className="absolute w-0.5 h-1 bg-neutral-500/30"
            style={{ 
              transform: `rotate(${tick}deg) translateY(-18px)`,
            }}
          />
        ))}
      </div>
      <div className="text-[11px] font-mono text-neutral-400">
        {value.toFixed(2)}
      </div>
    </div>
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
