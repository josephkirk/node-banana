# Implementation Plan: Float Input Node

**Goal:** Create a versatile `FloatInputNode` with multiple display modes and integration with the workflow variable system.

---

## Task 1: Foundation & Types

- [ ] **Step 1: Add `floatInput` to `NodeType` union**
  - Modify: `src/types/nodes.ts`
- [ ] **Step 2: Define `FloatInputNodeData` interface**
  - Modify: `src/types/nodes.ts`
- [ ] **Step 3: Set default dimensions and data**
  - Modify: `src/store/utils/nodeDefaults.ts`

## Task 2: Core Component

- [ ] **Step 1: Implement `Rotator` (Knob) UI sub-component**
  - Create internal utility for drag-to-rotate logic.
- [ ] **Step 2: Create `FloatInputNode` component**
  - Create: `src/components/nodes/FloatInputNode.tsx`
  - Implement Slider, Spinner, and Rotator modes.
- [ ] **Step 3: Register node in registry**
  - Modify: `src/components/nodes/index.ts`
  - Modify: `src/components/WorkflowCanvas.tsx`
- [ ] **Step 4: Update `FloatingActionBar`**
  - Modify: `src/components/FloatingActionBar.tsx`
  - Add to "Input" or "Parameters" category.

## Task 3: Variable Integration

- [ ] **Step 1: Update Variable Scanning logic**
  - Modify: `src/components/nodes/PromptConstructorNode.tsx`
  - Ensure `floatInput` nodes with `variableName` are picked up.
- [ ] **Step 2: Update `PromptNode` logic** (if it also uses variables)

## Task 4: Execution & Integration

- [ ] **Step 1: Update `getSourceOutput`**
  - Modify: `src/store/utils/connectedInputs.ts`
  - Ensure `floatInput` returns its value as type `float`.

---

## Verification

- [ ] **Step 1: Test Slider interaction**
- [ ] **Step 2: Test Spinner interaction**
- [ ] **Step 3: Test Rotator interaction**
- [ ] **Step 4: Verify `@variable` resolution in Prompt Constructor**
- [ ] **Step 5: Verify "Expose as Input" works in subflows**
