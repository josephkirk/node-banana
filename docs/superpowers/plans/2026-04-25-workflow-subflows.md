# Workflow Sub-flows Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a "Sub-flow" system that allows users to collapse selected nodes into a single Macro node, dive into its internal logic, and expose specific handles for interaction with the main canvas.

**Architecture:** A new `SubFlow` node type that stores or references a subgraph. The store is extended with a `navigationStack` to manage nested levels. Execution is recursive, using a specialized `subFlowExecutor`.

**Tech Stack:** Next.js, React Flow, Zustand.

---

## Chunk 1: Foundation & Types

### Task 1: Define Sub-flow Types
- **Modify:** `src/types/nodes.ts`
- [ ] **Step 1: Add `subflow` to `NodeType` union**
- [ ] **Step 2: Define `SubFlowNodeData` interface**

```typescript
export interface SubFlowNodeData extends BaseNodeData {
  name: string;
  subgraph?: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  externalPath?: string;
  isLinked: boolean;
  interfaceMapping: {
    inputs: { [externalHandleId: string]: { nodeId: string; handleId: string; type: string } };
    outputs: { [externalHandleId: string]: { nodeId: string; handleId: string; type: string } };
  };
}
```

- [ ] **Step 3: Commit**
```bash
git add src/types/nodes.ts
git commit -m "chore: add subflow node types"
```

### Task 2: Extend Store State & Navigation
- **Modify:** `src/store/workflowStore.ts`
- **Test:** `src/store/__tests__/navigation.test.ts`
- [ ] **Step 1: Add `navigationStack: string[]` to state** (Array of SubFlow node IDs)
- [ ] **Step 2: Implement `diveIn(nodeId: string)` and `diveOut()` actions**
    - `diveIn` pushes to stack.
    - `diveOut` pops from stack or clears if at root.
- [ ] **Step 3: Create navigation tests** (Verify stack integrity and view switching)
- [ ] **Step 4: Exclude `navigationStack` from store persistence**
- [ ] **Step 5: Commit**
```bash
git add src/store/workflowStore.ts src/store/__tests__/navigation.test.ts
git commit -m "feat: add navigation stack and tests to workflow store"
```

---

## Chunk 2: The "Collapse" Action

### Task 3: Implement Collapsing Logic
- **Modify:** `src/store/workflowStore.ts`
- **Test:** `src/store/__tests__/collapse.test.ts`
- [ ] **Step 1: Implement `collapseSelectedNodes()` logic**
    - **Identify Boundary:** 
        - `incomingEdges`: source NOT in selection, target IN selection.
        - `outgoingEdges`: source IN selection, target NOT in selection.
    - **Map Handles:**
        - Each `incomingEdge` target node becomes an internal input node.
        - Each `outgoingEdge` source node becomes an internal output node.
        - Generate unique `externalHandleId` based on internal node type + increment.
    - **Replace:**
        - Create `SubFlow` node at selection center.
        - Re-route boundary edges to the new `SubFlow` node's generated handles.
- [ ] **Step 2: Write tests for boundary re-routing**
- [ ] **Step 3: Ensure `undoHistory` captures the full replacement**
- [ ] **Step 4: Commit**
```bash
git add src/store/workflowStore.ts src/store/__tests__/collapse.test.ts
git commit -m "feat: implement collapsing logic with handle mapping"
```

### Task 4: UI Integration (Collapse Button)
- **Modify:** `src/components/FloatingActionBar.tsx`
- [ ] **Step 1: Add "Collapse" button visible when `selectedNodes.length >= 2`**
- [ ] **Step 2: Connect to `collapseSelectedNodes()`**
- [ ] **Step 3: Commit**
```bash
git add src/components/FloatingActionBar.tsx
git commit -m "feat: add Collapse button to FloatingActionBar"
```

---

## Chunk 3: Navigation & UI

### Task 5: Implement Breadcrumbs Component
- **Create:** `src/components/Breadcrumbs.tsx`
- **Test:** `src/components/__tests__/Breadcrumbs.test.tsx`
- [ ] **Step 1: Implement UI showing `Root / [NodeName] / ...`**
    - Fetch names from nodes corresponding to IDs in `navigationStack`.
- [ ] **Step 2: Render in `WorkflowCanvas.tsx` absolute-positioned overlay**
- [ ] **Step 3: Write tests for breadcrumb click-to-navigate**
- [ ] **Step 4: Commit**
```bash
git add src/components/Breadcrumbs.tsx src/components/__tests__/Breadcrumbs.test.tsx
git commit -m "feat: implement breadcrumb navigation UI"
```

### Task 6: Create SubFlowNode Component
- **Create:** `src/components/nodes/SubFlowNode.tsx`
- **Test:** `src/components/nodes/__tests__/SubFlowNode.test.tsx`
- [ ] **Step 1: Implement node UI with dynamic handles**
- [ ] **Step 2: Add `onDoubleClick` to trigger `diveIn`**
- [ ] **Step 3: Register in node registry**
- [ ] **Step 4: Commit**
```bash
git add src/components/nodes/SubFlowNode.tsx
git commit -m "feat: implement SubFlowNode component"
```

---

## Chunk 4: Interface & Execution

### Task 7: Expose Handle Logic
- **Modify:** `src/components/nodes/BaseNode.tsx`
- [ ] **Step 1: Implement `exposeHandle(nodeId: string, handleId: string, direction: 'input'|'output')`**
    - Find current parent ID from `navigationStack.at(-1)`.
    - Update parent's `interfaceMapping`.
- [ ] **Step 2: Add context menu option "Expose as Subflow Input/Output"**
- [ ] **Step 3: Commit**
```bash
git add src/components/nodes/BaseNode.tsx
git commit -m "feat: allow exposing internal handles via context menu"
```

### Task 8: Recursive Execution Engine
- **Create:** `src/store/execution/subFlowExecutor.ts`
- **Modify:** `src/store/workflowStore.ts`
- **Test:** `src/store/execution/__tests__/subflow.test.ts`
- [ ] **Step 1: Implement `executeSubFlow`**
    - Recursive topological sort of internal nodes.
    - Handle `isLinked` by fetching external file (via `hydrateWorkflowMedia` patterns).
    - Map parent values to internal node data.
    - Error handling: cycle detection (cross-boundary), missing files.
- [ ] **Step 2: Update `executeWorkflow` switch statement to call `executeSubFlow`**
- [ ] **Step 3: Write tests for multi-level nested execution**
- [ ] **Step 4: Commit**
```bash
git add src/store/execution/subFlowExecutor.ts src/store/workflowStore.ts
git commit -m "feat: implement recursive sub-flow execution"
```

---

## Chunk 5: Externalization

### Task 9: Link/Unlink Functionality button next to comment icon
- **Modify:** `src/store/workflowStore.ts`
- [ ] **Step 1: Implement `saveSubFlowToFile(nodeId: string)`**
    - Prompt for filename, use `saveWorkflow` logic to write.
- [ ] **Step 2: Implement `toggleSubFlowLink(nodeId: string)`**
    - If linking: clear `subgraph` data, set `isLinked: true`.
    - If unlinking: fetch file content, populate `subgraph`, set `isLinked: false`.
- [ ] **Step 3: Commit**
```bash
git add src/store/workflowStore.ts
git commit -m "feat: support linking sub-flows to external files"
```

---

## Chunk 6: Verification

### Task 10: Final Verification
- [ ] **Step 1: Test deep nesting (3 levels)**
- [ ] **Step 2: Verify all tests pass**
Run: `npm run test`
