import { describe, it, expect, beforeEach, vi } from "vitest";
import { useWorkflowStore } from "../workflowStore";
import { XYPosition } from "@xyflow/react";

describe("Workflow Collapsing", () => {
  beforeEach(() => {
    useWorkflowStore.getState().clearWorkflow();
  });

  it("should fail to collapse with fewer than 2 nodes", () => {
    const { addNode, collapseSelectedNodes } = useWorkflowStore.getState();
    
    addNode("prompt", { x: 0, y: 0 });
    // Select the node
    useWorkflowStore.setState((state) => ({
      nodes: state.nodes.map(n => ({ ...n, selected: true }))
    }));

    const subflowId = collapseSelectedNodes();
    expect(subflowId).toBeNull();
  });

  it("should collapse selected nodes into a subflow node", () => {
    const { addNode, onConnect, collapseSelectedNodes } = useWorkflowStore.getState();
    
    const node1Id = addNode("prompt", { x: 0, y: 0 });
    const node2Id = addNode("nanoBanana", { x: 400, y: 0 });
    
    onConnect({
      source: node1Id,
      sourceHandle: "text",
      target: node2Id,
      targetHandle: "inputPrompt",
    });

    // Select both nodes
    useWorkflowStore.setState((state) => ({
      nodes: state.nodes.map(n => ({ ...n, selected: true }))
    }));

    const subflowId = collapseSelectedNodes();
    expect(subflowId).not.toBeNull();
    
    const state = useWorkflowStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].type).toBe("subflow");
    expect(state.edges).toHaveLength(0); // Internal edge moved to subgraph
    
    const subflowNode = state.nodes[0];
    const subgraph = subflowNode.data.subgraph;
    expect(subgraph.nodes).toHaveLength(2);
    expect(subgraph.edges).toHaveLength(1);
  });

  it("should re-route boundary edges when collapsing", () => {
    const { addNode, onConnect, collapseSelectedNodes } = useWorkflowStore.getState();
    
    const extInId = addNode("prompt", { x: -400, y: 0 });
    const node1Id = addNode("prompt", { x: 0, y: 0 });
    const node2Id = addNode("nanoBanana", { x: 400, y: 0 });
    const extOutId = addNode("output", { x: 800, y: 0 });
    
    onConnect({ source: extInId, sourceHandle: "text", target: node1Id, targetHandle: "text" });
    onConnect({ source: node1Id, sourceHandle: "text", target: node2Id, targetHandle: "inputPrompt" });
    onConnect({ source: node2Id, sourceHandle: "image", target: extOutId, targetHandle: "image" });

    // Select middle two nodes
    useWorkflowStore.setState((state) => ({
      nodes: state.nodes.map(n => ({ 
        ...n, 
        selected: n.id === node1Id || n.id === node2Id 
      }))
    }));

    const subflowId = collapseSelectedNodes();
    const state = useWorkflowStore.getState();
    
    expect(state.nodes).toHaveLength(3); // extIn, extOut, and subflow
    expect(state.edges).toHaveLength(2); // Incoming and outgoing boundary edges
    
    const incomingEdge = state.edges.find(e => e.target === subflowId);
    expect(incomingEdge).toBeDefined();
    expect(incomingEdge?.source).toBe(extInId);
    
    const outgoingEdge = state.edges.find(e => e.source === subflowId);
    expect(outgoingEdge).toBeDefined();
    expect(outgoingEdge?.target).toBe(extOutId);

    const subflowNode = state.nodes.find(n => n.id === subflowId);
    const mapping = subflowNode?.data.interfaceMapping;
    expect(mapping.inputs).toHaveProperty(incomingEdge?.targetHandle!);
    expect(mapping.outputs).toHaveProperty(outgoingEdge?.sourceHandle!);
  });
});
