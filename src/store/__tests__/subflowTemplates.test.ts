import { describe, it, expect, vi, beforeEach } from "vitest";
import { useWorkflowStore } from "../workflowStore";

vi.stubGlobal("fetch", vi.fn());

describe("Subflow Template Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkflowStore.setState({ nodes: [], edges: [], groups: {} });
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
      json: () => Promise.resolve({ workflow: mockSubgraph }),
    });

    // Add a dummy subflow node
    useWorkflowStore.setState({
      nodes: [{ id: "subflow-1", type: "subflow", data: {}, position: { x: 0, y: 0 } }] as any,
    });

    const result = await store.loadSubFlowTemplate("subflow-1", "test-template");

    expect(fetch).toHaveBeenCalledWith("/api/subflow-templates/load?name=test-template");
    expect(result).toBe(true);
    
    const updatedNode = useWorkflowStore.getState().nodes.find(n => n.id === "subflow-1");
    expect(updatedNode?.data.subgraph).toEqual(mockSubgraph);
  });

  it("should include version in URL if provided to loadSubFlowTemplate", async () => {
    const store = useWorkflowStore.getState();
    const mockSubgraph = { nodes: [{ id: "n1" }], edges: [] };
    
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ workflow: mockSubgraph }),
    });

    // Add a dummy subflow node
    useWorkflowStore.setState({
      nodes: [{ id: "subflow-1", type: "subflow", data: {}, position: { x: 0, y: 0 } }] as any,
    });

    const result = await store.loadSubFlowTemplate("subflow-1", "test-template", 2);

    expect(fetch).toHaveBeenCalledWith("/api/subflow-templates/load?name=test-template&version=2");
    expect(result).toBe(true);
  });

  it("should return false when loadSubFlowTemplate fails", async () => {
    const store = useWorkflowStore.getState();
    (fetch as any).mockResolvedValue({
      ok: false,
    });

    const result = await store.loadSubFlowTemplate("subflow-1", "test-template");
    expect(result).toBe(false);
  });
});
