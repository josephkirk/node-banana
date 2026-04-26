# Subflow Template Management - Task 1: Types & Store Infrastructure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define the types for subflow templates and add the necessary actions to the Zustand store.

**Architecture:** Extend the existing `WorkflowStore` with actions to save and load subflow templates via API calls.

**Tech Stack:** Next.js, TypeScript, Zustand, Vitest.

---

### Task 1.1: Create Template Types

**Files:**
- Create: `src/types/subflowTemplates.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Create `src/types/subflowTemplates.ts`**

```typescript
export interface TemplateVersion {
  path: string;
  timestamp: string;
}

export interface TemplateMetadata {
  name: string;
  description: string;
  currentVersion: number;
  previewPath?: string;
  previewData?: string; // Base64 data for browser preview
  versions: Record<string, TemplateVersion>;
  lastModified: string;
}

export interface SaveTemplateRequest {
  subflowId: string;
  templateName: string;
  description: string;
  workflow: any;
  previewImage?: string; // Data URL
}
```

- [ ] **Step 2: Export from `src/types/index.ts`**

```typescript
export * from './subflowTemplates';
```

---

### Task 1.2: Add Store Actions (TDD)

**Files:**
- Modify: `src/store/workflowStore.ts`
- Create: `src/store/__tests__/subflowTemplates.test.ts`

- [ ] **Step 1: Create failing tests in `src/store/__tests__/subflowTemplates.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useWorkflowStore } from "../workflowStore";

vi.stubGlobal("fetch", vi.fn());

describe("Subflow Template Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call save API when saveSubFlowAsTemplate is called", async () => {
    const store = useWorkflowStore.getState();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const result = await store.saveSubFlowAsTemplate({
      subflowId: "subflow-1",
      templateName: "Test Template",
      description: "Test Description",
      workflow: { nodes: [], edges: [] },
    });

    expect(fetch).toHaveBeenCalledWith("/api/subflow-templates/save", expect.objectContaining({
      method: "POST",
    }));
    expect(result).toBe(true);
  });

  it("should call load API and update node data when loadSubFlowTemplate is called", async () => {
    const store = useWorkflowStore.getState();
    const mockSubgraph = { nodes: [{ id: "n1" }], edges: [] };
    
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ subgraph: mockSubgraph }),
    });

    // Add a dummy subflow node
    useWorkflowStore.setState({
      nodes: [{ id: "subflow-1", type: "subflow", data: {}, position: { x: 0, y: 0 } }],
    });

    await store.loadSubFlowTemplate("subflow-1", "test-template");

    expect(fetch).toHaveBeenCalledWith("/api/subflow-templates/load?name=test-template");
    
    const updatedNode = useWorkflowStore.getState().nodes.find(n => n.id === "subflow-1");
    expect(updatedNode?.data.subgraph).toEqual(mockSubgraph);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest src/store/__tests__/subflowTemplates.test.ts`
Expected: FAIL (methods not defined)

- [ ] **Step 3: Update `WorkflowStore` interface in `src/store/workflowStore.ts`**

Add to `WorkflowStore` interface:
```typescript
  saveSubFlowAsTemplate: (request: SaveTemplateRequest) => Promise<boolean>;
  loadSubFlowTemplate: (subflowId: string, templateName: string) => Promise<void>;
```

- [ ] **Step 4: Implement actions in `src/store/workflowStore.ts`**

```typescript
  saveSubFlowAsTemplate: async (request: SaveTemplateRequest) => {
    try {
      const response = await fetch("/api/subflow-templates/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to save subflow template:", error);
      return false;
    }
  },

  loadSubFlowTemplate: async (subflowId: string, templateName: string) => {
    try {
      const response = await fetch(`/api/subflow-templates/load?name=${encodeURIComponent(templateName)}`);
      if (!response.ok) throw new Error("Failed to load template");
      
      const { subgraph } = await response.json();
      get().updateNodeData(subflowId, { subgraph });
    } catch (error) {
      console.error("Failed to load subflow template:", error);
    }
  },
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest src/store/__tests__/subflowTemplates.test.ts`
Expected: PASS

- [ ] **Step 6: Commit changes**

```bash
git add src/types/subflowTemplates.ts src/types/index.ts src/store/workflowStore.ts src/store/__tests__/subflowTemplates.test.ts
git commit -m "feat: add subflow template management store actions and types"
```
