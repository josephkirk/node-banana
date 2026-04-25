# Unified Workflow Input Node Spec

## 1. Overview
We are refactoring the Subflow Input system. The context-menu based "Expose as Input" mechanic is being removed. Instead, a unified **Workflow Input** node will act as the single entry point for all data types (Image, Video, Audio, Text, Float) entering a Subflow. 

Text and Float inputs will integrate with the existing variable (`@var`) mechanic used by Prompt and Prompt Constructor nodes.

## 2. Requirements
- **New Node (`WorkflowInputNode`):** A unified node for providing data.
  - **Data Types:** Configurable to handle `image`, `video`, `audio`, `text` (prompt), or `float`.
  - **Variable Name:** A required name field. This name acts as:
    1. The label for the input handle on the parent `SubFlowNode`.
    2. The variable name (`@name`) used in Prompt/PromptConstructor nodes.
  - **Default Value:** A fallback value used if the parent Subflow node doesn't provide one (or if used on the Root canvas).
- **Subflow Input Handles:** `SubFlowNode` automatically derives its input handles by scanning its internal `subgraph.nodes` for `WorkflowInputNode`s. `interfaceMapping.inputs` is deprecated or auto-generated.
- **Context Menu:** Remove "Expose as Subflow Input". Keep "Expose as Subflow Output".
- **Collapse Logic:** When collapsing nodes into a Subflow, any external incoming boundary edges will automatically generate a corresponding `WorkflowInputNode` inside the new Subflow, wired to the original targets.

## 3. Architecture & Data Flow
- **Component:** `WorkflowInputNode.tsx`.
- **Node Data:**
  ```typescript
  export interface WorkflowInputNodeData extends BaseNodeData {
    inputType: "image" | "video" | "audio" | "text" | "float";
    variableName: string;      // e.g., "subject_image" or "cfg_scale"
    defaultValue: string | number | null; // e.g., default prompt or float value
    injectedValue?: any;       // The value passed down from the parent Subflow during execution
  }
  ```
- **Execution:**
  - `subFlowExecutor` finds all `WorkflowInputNode`s in the subgraph.
  - For each, it reads the corresponding handle value from the parent `SubFlow` node's connected inputs.
  - It sets this value as the `injectedValue` (or directly updates `defaultValue`/`value` field) so internal nodes can consume it via standard edge connections.

## 4. UI Details
- **Node UI:** 
  - Dropdown to select `inputType`.
  - Input field for `variableName`.
  - Content area changes based on type (e.g., text area for strings, number input for floats, image uploader for images).
- **Integration:** Added to `FloatingActionBar` under the "Input" category.
- **Prompt Constructor:** Updated to recognize `WorkflowInputNode` (where `inputType` is text or float) as a valid variable source for the autocomplete drop-down.

## 5. Migration Strategy
- Remove "Expose as Input" button from `CanvasContextMenu.tsx`.
- Update `collapseSelectedNodes` in `workflowStore.ts` to instantiate `WorkflowInputNode`s instead of just mapping boundaries.
- Update `SubFlowNode` to map inputs dynamically based on `WorkflowInputNode`s rather than `interfaceMapping.inputs`.
