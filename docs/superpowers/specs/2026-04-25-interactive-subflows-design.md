# Design: Interactive Subflow Surface

Enable direct interaction with internal `floatInput` nodes from the parent `SubFlowNode` surface, provide visual output previews, and add standard floating headers for execution control.

## 1. Architectural Changes

### Component Refactoring
- **Create:** `src/components/nodes/InputControls.tsx`.
- **Move:** `Rotator`, `SliderUI`, and `Spinner` components from `FloatInputNode.tsx` to this new file.
- These components will be pure UI components that accept `value`, `min`, `max`, `step`, and an `onChange` callback.

### Subflow Surface Mapping
- `SubFlowNode.tsx` will scan its `data.subgraph.nodes` during render.
- For each entry in `interfaceMapping.inputs`, it will check if the corresponding internal node is a `floatInput`.
- If matched, it will render the specific display type (`slider`, `spinner`, `rotator`) on the Subflow node's body.

## 2. Interactive Behavior

### Value Synchronization & Auto-Execution
- **New Store Action:** Add `updateSubFlowInternalNodeData(parentId, internalNodeId, data)` to `workflowStore.ts`. This allows atomic updates to internal nodes without complex pathing in the component.
- **Debounced Execution:** To prevent API flooding and UI lag, interactions on the Subflow surface will trigger `executeWorkflow(nodeId)` through a **250ms debounce**.
- The `isRunning` guard in `executeWorkflow` will naturally handle dropped requests during active execution.

### Visual Preview (Preview Detector)
- The `SubFlowNode` component will search its internal `subgraph.nodes` for the first node with a non-null value in any of these fields: `outputImage`, `image`, `video`, `outputVideo`, `outputAudio`.
- **Priority:** Nodes mapped to `interfaceMapping.outputs` should be checked first for the preview detector to ensure the user sees the "intended" output.
- This preview will be displayed as a responsive media box on the Subflow node.

## 3. UI/UX Enhancements

### Floating Node Header
- Update `src/components/nodes/FloatingNodeHeader.tsx` to include `subflow` in `RUNNABLE_TYPES`.
- Update `WorkflowCanvas.tsx` to render `FloatingNodeHeader` for `subflow` nodes.
- **Condition:** Only show the header if `Object.keys(interfaceMapping.outputs).length > 0`.
- **Actions:** 
  - **Run Node:** Executes the internal subgraph via the `subFlowExecutor`.
  - **Fallback:** Enabled if a fallback mapping exists.

### Layout
- The Subflow node will adopt a "Generate-like" layout:
  - Top: Preview area (if output exists).
  - Middle: Interactive surface controls (mapped float inputs).
  - Bottom: "Dive In" button and node metadata.

## 4. Testing Strategy
- **Unit Tests:** Verify that `resolveLabel` correctly finds custom names and handle IDs.
- **Integration Tests:** Verify that updating a surface control correctly modifies the internal node's data in the store and triggers a debounced re-run of the subflow.
- **Visual Tests:** Confirm the Floating Header only appears when outputs are exposed.
- **Performance:** Ensure debouncing prevents excessive re-renders/runs during dial dragging.
