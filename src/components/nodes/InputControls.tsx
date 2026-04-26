"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface InputControlProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number, loop?: boolean) => void;
  showValue?: boolean;
}

export function Rotator({
  value,
  min,
  max,
  onChange,
  showValue = true,
}: InputControlProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track cumulative rotation in degrees for visual smoothness
  const [visualRotation, setVisualRotation] = useState(() => {
    const range = max - min;
    if (range === 0) return 0;
    const percent = (value - min) / range;
    return percent * 360;
  });

  // Shortest-path update to visual rotation to avoid backward flips when state updates externally
  const syncVisualRotation = useCallback((targetAngle: number) => {
    setVisualRotation((prev) => {
      const diff = (((targetAngle - (prev % 360)) + 540) % 360) - 180;
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

  const updateValueFromEvent = useCallback(
    (clientX: number, clientY: number) => {
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
    },
    [min, max, onChange, syncVisualRotation]
  );

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

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
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
        {[0, 90, 180, 270].map((tick) => (
          <div
            key={tick}
            className="absolute w-0.5 h-1 bg-neutral-500/30"
            style={{
              transform: `rotate(${tick}deg) translateY(-18px)`,
            }}
          />
        ))}
      </div>
      {showValue && (
        <div className="text-[11px] font-mono text-neutral-400">
          {value.toFixed(2)}
        </div>
      )}
    </div>
  );
}

export function SliderUI({
  value,
  min,
  max,
  step,
  onChange,
  showValue = true,
}: InputControlProps) {
  return (
    <div className="w-full space-y-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="nodrag nopan w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      {showValue && (
        <div className="text-center font-mono text-xs text-white">{value}</div>
      )}
    </div>
  );
}

export function SpinnerUI({
  value,
  min,
  max,
  step,
  onChange,
  showValue = true,
}: InputControlProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(value - step)}
        className="nodrag nopan p-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-white"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M20 12H4" strokeWidth={2} />
        </svg>
      </button>
      {showValue && (
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="nodrag nopan w-20 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-center text-sm text-white focus:outline-none focus:border-blue-500"
        />
      )}
      <button
        onClick={() => onChange(value + step)}
        className="nodrag nopan p-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-white"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 4v16m8-8H4" strokeWidth={2} />
        </svg>
      </button>
    </div>
  );
}
