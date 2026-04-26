# Interactive Subflow Surface Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable direct interaction with internal `floatInput` nodes and visual output previews on the Subflow node surface.

**Architecture:** Refactor interactive UI controls into shared components, add a specialized store action for targeting internal nodes within subgraphs, and update the Subflow node to dynamically map internal inputs to its surface with debounced execution.

**Tech Stack:** React (TypeScript), Zustand (Store), React Flow, Tailwind CSS.

---

## Chunk 1: Shared Infrastructure

### Task 1: Component Refactoring

**Files:**
- Create: `src/components/nodes/InputControls.tsx`
- Modify: `src/components/nodes/FloatInputNode.tsx`

- [ ] **Step 1: Create shared InputControls file**
Create `src/components/nodes/InputControls.tsx` and move the `Rotator`, `SliderUI`, and `Spinner` logic from `FloatInputNode.tsx`. Add a `showValue` prop to all components.

- [ ] **Step 2: Update FloatInputNode to use shared components**
Import and use the new components in `FloatInputNode.tsx` to verify no regressions in the standalone node.

- [ ] **Step 3: Commit refactoring**
```bash
git add src/components/nodes/InputControls.tsx src/components/nodes/FloatInputNode.tsx
git commit -m "refactor: extract shared input controls for use in subflows"
```

### Task 2: Store Enhancement

**Files:**
- Modify: `src/store/workflowStore.ts`

- [ ] **Step 1: Add updateSubFlowInternalNodeData action**
Add a new action to the store that allows updating a node's data inside a subflow's subgraph.

```typescript
updateSubFlowInternalNodeData: (subflowId: string, internalNodeId: string, data: any) => void;
```
Ensure this action updates the parent node's `data.subgraph.nodes` and pushes an undo checkpoint.

- [ ] **Step 3: Fix hardcoded subflow concurrency**
Modify `src/store/execution/subFlowExecutor.ts` to replace hardcoded `chunk(..., 3)` with `maxConcurrentCalls` from the store.

- [ ] **Step 4: Commit store and executor changes**
```bash
git add src/store/workflowStore.ts src/store/execution/subFlowExecutor.ts
git commit -m "feat: enhance store and subflow executor for interactive surfaces"
```

---

## Chunk 2: Subflow Surface Implementation

### Task 3: Interactive Surface & Preview

**Files:**
- Modify: `src/components/nodes/SubFlowNode.tsx`

- [ ] **Step 1: Implement Preview Detector**
Add logic to scan `data.subgraph.nodes`. Priority: Nodes in `interfaceMapping.outputs`. Fallback: First node with media output (`outputImage`, `video`, etc.). Display in square preview.

- [ ] **Step 2: Implement Control Surface Mapping**
Map over `interfaceMapping.inputs`. For each mapped `floatInput`, render its control UI in a compact grid (`grid-cols-[1fr_auto]`) with name headers. Use `showValue={false}` for shared controls.

- [ ] **Step 3: Add Debounced Auto-Execution**
Implement a 250ms debounced `executeWorkflow(id)` using `lodash.debounce` and `useMemo` for surface interactions.

- [ ] **Step 4: Commit Subflow implementation**
```bash
git add src/components/nodes/SubFlowNode.tsx
git commit -m "feat: implement interactive surface and preview on Subflow node"
```

### Task 4: Floating Node Header Enablement

**Files:**
- Modify: `src/components/nodes/FloatingNodeHeader.tsx`
- Modify: `src/components/WorkflowCanvas.tsx`

- [ ] **Step 1: Enable Run button for subflows**
Add `subflow` to `RUNNABLE_TYPES` in `FloatingNodeHeader.tsx`.

- [ ] **Step 2: Conditionally render header in WorkflowCanvas**
Update the header rendering loop in `WorkflowCanvas.tsx` to include `subflow` nodes if they have exposed outputs.

- [ ] **Step 3: Final Commit**
```bash
git add src/components/nodes/FloatingNodeHeader.tsx src/components/WorkflowCanvas.tsx
git commit -m "feat: enable floating node headers for subflows"
```
