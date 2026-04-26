import { NodeType } from "@/types";
import { Edge, Connection, Node } from "@xyflow/react";

// Helper to determine handle type from handle ID
// For dynamic handles, we use naming convention: image inputs contain "image", text inputs are "prompt" or "negative_prompt"
export const getHandleType = (handleId: string | null | undefined): "image" | "text" | "video" | "audio" | "3d" | "easeCurve" | null => {
  if (!handleId) return null;
  // Generic Router handles — return null to allow any type connection
  if (handleId === "generic-input" || handleId === "generic-output") return null;
  // EaseCurve handles (must check before other types)
  if (handleId === "easeCurve") return "easeCurve";
  // 3D handles
  if (handleId === "3d") return "3d";
  // Standard handles
  if (handleId === "video") return "video";
  if (handleId === "audio" || handleId.startsWith("audio")) return "audio";
  if (handleId === "image" || handleId === "text" || handleId === "value" || handleId === "float") return handleId === "image" ? "image" : "text";
  // Dynamic handles - check naming patterns (including indexed: text-0, image-0)
  if (handleId.includes("video")) return "video";
  if (handleId.startsWith("image-") || handleId.includes("image") || handleId.includes("frame")) return "image";
  if (handleId.startsWith("text-") || handleId === "prompt" || handleId === "negative_prompt" || handleId.includes("prompt") || handleId.includes("value") || handleId.includes("float")) return "text";
  return null;
};

// Define which handles each node type has
export const getNodeHandles = (nodeType: string): { inputs: string[]; outputs: string[] } => {
  switch (nodeType) {
    case "floatInput":
      return { inputs: [], outputs: ["value"] };
    case "imageInput":
      return { inputs: ["reference"], outputs: ["image"] };
    case "audioInput":
      return { inputs: ["audio"], outputs: ["audio"] };
    case "videoInput":
      return { inputs: ["video"], outputs: ["video"] };
    case "annotation":
      return { inputs: ["image"], outputs: ["image"] };
    case "prompt":
      return { inputs: ["text"], outputs: ["text"] };
    case "array":
      return { inputs: ["text"], outputs: ["text"] };
    case "promptConstructor":
      return { inputs: ["text"], outputs: ["text"] };
    case "nanoBanana":
      return { inputs: ["image", "text"], outputs: ["image"] };
    case "generateVideo":
      return { inputs: ["image", "text", "audio"], outputs: ["video"] };
    case "generate3d":
      return { inputs: ["image", "text"], outputs: ["3d"] };
    case "generateAudio":
      return { inputs: ["text"], outputs: ["audio"] };
    case "llmGenerate":
      return { inputs: ["text", "image"], outputs: ["text"] };
    case "splitGrid":
      return { inputs: ["image"], outputs: ["reference"] };
    case "output":
      return { inputs: ["image", "video", "audio"], outputs: [] };
    case "outputGallery":
      return { inputs: ["image", "video"], outputs: [] };
    case "imageCompare":
      return { inputs: ["image"], outputs: [] };
    case "videoStitch":
      return { inputs: ["video", "audio"], outputs: ["video"] };
    case "easeCurve":
      return { inputs: ["video", "easeCurve"], outputs: ["video", "easeCurve"] };
    case "videoTrim":
      return { inputs: ["video"], outputs: ["video"] };
    case "videoFrameGrab":
      return { inputs: ["video"], outputs: ["image"] };
    case "crop":
      return { inputs: ["image"], outputs: ["image"] };
    case "subflow":
      return { inputs: [], outputs: [] }; // Handles managed dynamically in SubFlowNode
    case "router":
      return { inputs: ["image", "text", "video", "audio", "3d", "easeCurve", "generic-input"], outputs: ["image", "text", "video", "audio", "3d", "easeCurve", "generic-output"] };
    case "switch":
      return { inputs: ["generic-input"], outputs: [] };
    case "conditionalSwitch":
      return { inputs: ["text"], outputs: [] };
    case "glbViewer":
      return { inputs: ["3d"], outputs: ["image"] };
    default:
      return { inputs: [], outputs: [] };
  }
};

export interface ConnectionDropState {
  position: { x: number; y: number };
  flowPosition: { x: number; y: number };
  handleType: "image" | "text" | "video" | "audio" | "3d" | "easeCurve" | null;
  connectionType: "source" | "target";
  sourceNodeId: string | null;
  sourceHandleId: string | null;
}

// Detect if running on macOS for platform-specific trackpad behavior
export const isMacOS = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

// Detect if a wheel event is from a mouse (vs trackpad)
export const isMouseWheel = (event: WheelEvent): boolean => {
  if (event.deltaMode === 1) return true;
  const threshold = 50;
  return Math.abs(event.deltaY) >= threshold && Math.abs(event.deltaY) % 40 === 0;
};

// Check if an element can scroll and has room to scroll in the given direction
export const canElementScroll = (element: HTMLElement, deltaX: number, deltaY: number): boolean => {
  const style = window.getComputedStyle(element);
  const overflowY = style.overflowY;
  const overflowX = style.overflowX;

  const canScrollY = overflowY === 'auto' || overflowY === 'scroll';
  const canScrollX = overflowX === 'auto' || overflowX === 'scroll';

  if (canScrollY && deltaY !== 0) {
    const hasVerticalScroll = element.scrollHeight > element.clientHeight;
    if (hasVerticalScroll) {
      if (deltaY > 0 && element.scrollTop < element.scrollHeight - element.clientHeight) return true;
      if (deltaY < 0 && element.scrollTop > 0) return true;
    }
  }

  if (canScrollX && deltaX !== 0) {
    const hasHorizontalScroll = element.scrollWidth > element.clientWidth;
    if (hasHorizontalScroll) {
      if (deltaX > 0 && element.scrollLeft < element.scrollWidth - element.clientWidth) return true;
      if (deltaX < 0 && element.scrollLeft > 0) return true;
    }
  }

  return false;
};

// Find if the target element or any ancestor is scrollable
export const findScrollableAncestor = (target: HTMLElement, deltaX: number, deltaY: number): HTMLElement | null => {
  let current: HTMLElement | null = target;

  while (current && !current.classList.contains('react-flow')) {
    if (current.classList.contains('nowheel') || current.tagName === 'TEXTAREA') {
      if (canElementScroll(current, deltaX, deltaY)) return current;
    }
    current = current.parentElement;
  }

  return null;
};

/** Shared ref so child components (BaseNode) can check panning state without re-rendering */
export const isPanningRef = { current: false };
/** Shared ref so child components (BaseNode) can skip hover updates during node drags */
export const isDraggingNodeRef = { current: false };
