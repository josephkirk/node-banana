# Implementation Plan: Refactor Workflow Inputs

**Goal:** Replace the manual "Expose Input" mechanic with a unified `WorkflowInputNode` that automatically maps to subflow handles and integrates with the variable system.

---

## Task 1: Foundation & Types

- [ ] **Step 1: Add `workflowInput` to `NodeType` union**
  - Modify: `src/types/nodes.ts`
- [ ] **Step 2: Define `WorkflowInputNodeData` interface**
  - Modify: `src/types/nodes.ts`
- [ ] **Step 3: Set default dimensions and data for the new node**
  - Modify: `src/store/utils/nodeDefaults.ts`

## Task 2: Core Components

- [ ] **Step 1: Create `WorkflowInputNode` component**
  - Create: `src/components/nodes/WorkflowInputNode.tsx`
  - Implement type selection, name input, and default value UI.
- [ ] **Step 2: Register node in node registry**
  - Modify: `src/components/nodes/index.ts`
  - Modify: `src/components/WorkflowCanvas.tsx`
- [ ] **Step 3: Update `FloatingActionBar`**
  - Modify: `src/components/FloatingActionBar.tsx`
  - Add `WorkflowInputNode` to the "Input" category.

## Task 3: Variable Integration

- [ ] **Step 1: Update `PromptConstructorNode` to recognize `WorkflowInputNode`**
  - Modify: `src/components/nodes/PromptConstructorNode.tsx`
  - Add logic to scan for `workflowInput` nodes with matching variable names.

## Task 4: Subflow Refactoring

- [ ] **Step 1: Update `SubFlowNode` handle mapping**
  - Modify: `src/components/nodes/SubFlowNode.tsx`
  - Implement dynamic input handles by scanning the `subgraph.nodes` for `WorkflowInputNode`s.
- [ ] **Step 2: Remove "Expose as Input" from Context Menu**
  - Modify: `src/components/CanvasContextMenu.tsx`
- [ ] **Step 3: Update `collapseSelectedNodes` logic**
  - Modify: `src/store/workflowStore.ts`
  - Change boundary detection to create `WorkflowInputNode`s inside the new subflow.

## Task 5: Execution Engine

- [ ] **Step 1: Update `subFlowExecutor.ts`**
  - Modify: `src/store/execution/subFlowExecutor.ts`
  - Inject parent handle values into internal `WorkflowInputNode`s.

---

## Verification

- [ ] **Step 1: Manual test of collapsing nodes with incoming edges**
- [ ] **Step 2: Verify `WorkflowInputNode` handles Image/Text/Float correctly**
- [ ] **Step 3: Verify `@variable` resolution in Prompt Constructor within a subflow**
- [ ] **Step 4: Run test suite**
