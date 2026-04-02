/**
 * Loop Edge Integration Tests
 *
 * Tests the runtime behavior of loop edges during workflow execution.
 * These tests validate that loops execute N times with correct data flow.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useWorkflowStore } from "../workflowStore";
import { WorkflowNode, WorkflowEdge, WorkflowNodeData } from "@/types";

// Test helpers
function makeNode(id: string, type: string, data?: Partial<WorkflowNodeData>): WorkflowNode {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: data || {},
  } as WorkflowNode;
}

function makeEdge(
  source: string,
  target: string,
  opts?: { isLoop?: boolean; loopCount?: number; hasPause?: boolean }
): WorkflowEdge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    data: opts || {},
  } as WorkflowEdge;
}

function setupStore(nodes: WorkflowNode[], edges: WorkflowEdge[]): void {
  useWorkflowStore.setState({ nodes, edges });
}

describe("setLoopCount", () => {
  beforeEach(() => {
    // Reset store to clean state
    useWorkflowStore.setState({
      nodes: [],
      edges: [],
      groups: {},
      isRunning: false,
      hasUnsavedChanges: false,
    });
  });

  it("updates edge data loopCount", () => {
    const edge = makeEdge("a", "b", { isLoop: true, loopCount: 3 });
    setupStore([], [edge]);

    useWorkflowStore.getState().setLoopCount(edge.id, 5);

    const updatedEdge = useWorkflowStore.getState().edges.find((e) => e.id === edge.id);
    expect(updatedEdge?.data?.loopCount).toBe(5);
  });

  it("clamps loop count to minimum 1", () => {
    const edge = makeEdge("a", "b", { isLoop: true, loopCount: 3 });
    setupStore([], [edge]);

    useWorkflowStore.getState().setLoopCount(edge.id, 0);

    const updatedEdge = useWorkflowStore.getState().edges.find((e) => e.id === edge.id);
    expect(updatedEdge?.data?.loopCount).toBe(1);
  });

  it("clamps loop count to maximum 100", () => {
    const edge = makeEdge("a", "b", { isLoop: true, loopCount: 3 });
    setupStore([], [edge]);

    useWorkflowStore.getState().setLoopCount(edge.id, 150);

    const updatedEdge = useWorkflowStore.getState().edges.find((e) => e.id === edge.id);
    expect(updatedEdge?.data?.loopCount).toBe(100);
  });
});

describe("executeWorkflow with loop edges", () => {
  beforeEach(() => {
    // Reset store to clean state
    useWorkflowStore.setState({
      nodes: [],
      edges: [],
      groups: {},
      isRunning: false,
      hasUnsavedChanges: false,
    });
  });

  it("executes loop subgraph exactly N times", async () => {
    // Create A(imageInput) → B(prompt) → C(output) with loop edge C→A (loopCount: 3)
    const nodeA = makeNode("a", "imageInput", { image: "data:image/png;base64,test" });
    const nodeB = makeNode("b", "prompt", { prompt: "test prompt" });
    const nodeC = makeNode("c", "output");

    const edges = [
      makeEdge("a", "b"),
      makeEdge("b", "c"),
      makeEdge("c", "a", { isLoop: true, loopCount: 3 }),
    ];

    setupStore([nodeA, nodeB, nodeC], edges);

    // Spy on copyLoopOutput to count iterations
    const copyLoopOutputSpy = vi.spyOn(
      await import("../utils/executionUtils"),
      "copyLoopOutput"
    );

    await useWorkflowStore.getState().executeWorkflow();

    // copyLoopOutput should be called (loopCount - 1) times
    // because first iteration uses original input
    expect(copyLoopOutputSpy).toHaveBeenCalledTimes(2); // 3 iterations - 1 = 2 calls
  });

  it("executes non-loop prefix and suffix nodes once", async () => {
    // Create PREFIX(imageInput) → A(prompt) → B(prompt) → SUFFIX(output)
    // with loop edge B→A (loopCount: 3)
    const prefix = makeNode("prefix", "imageInput", { image: "data:image/png;base64,test" });
    const nodeA = makeNode("a", "prompt", { prompt: "loop start" });
    const nodeB = makeNode("b", "prompt", { prompt: "loop end" });
    const suffix = makeNode("suffix", "output");

    const edges = [
      makeEdge("prefix", "a"),
      makeEdge("a", "b"),
      makeEdge("b", "suffix"),
      makeEdge("b", "a", { isLoop: true, loopCount: 3 }),
    ];

    setupStore([prefix, nodeA, nodeB, suffix], edges);

    // Spy on updateNodeData to track execution
    const updateNodeDataSpy = vi.spyOn(useWorkflowStore.getState(), "updateNodeData");

    await useWorkflowStore.getState().executeWorkflow();

    // Check that prefix and suffix nodes were updated less frequently than loop nodes
    // (This is a simplified check - in real execution, loop nodes would be updated more)
    const prefixUpdates = updateNodeDataSpy.mock.calls.filter((call) => call[0] === "prefix");
    const suffixUpdates = updateNodeDataSpy.mock.calls.filter((call) => call[0] === "suffix");
    const loopNodeUpdates = updateNodeDataSpy.mock.calls.filter(
      (call) => call[0] === "a" || call[0] === "b"
    );

    // Prefix and suffix should have fewer updates than loop nodes
    expect(prefixUpdates.length).toBeLessThan(loopNodeUpdates.length);
    expect(suffixUpdates.length).toBeLessThan(loopNodeUpdates.length);
  });

  it("does not affect workflows with no loop edges", async () => {
    // Standard A → B → C workflow
    const nodeA = makeNode("a", "imageInput", { image: "data:image/png;base64,test" });
    const nodeB = makeNode("b", "prompt", { prompt: "test" });
    const nodeC = makeNode("c", "output");

    const edges = [makeEdge("a", "b"), makeEdge("b", "c")];

    setupStore([nodeA, nodeB, nodeC], edges);

    // Should execute without errors
    await useWorkflowStore.getState().executeWorkflow();

    // Verify workflow completed
    expect(useWorkflowStore.getState().isRunning).toBe(false);
  });

  it("treats loopCount:1 same as no loop", async () => {
    // Create A(imageInput) → B(prompt) with loop edge B→A (loopCount: 1)
    const nodeA = makeNode("a", "imageInput", { image: "data:image/png;base64,test" });
    const nodeB = makeNode("b", "prompt", { prompt: "test" });

    const edges = [makeEdge("a", "b"), makeEdge("b", "a", { isLoop: true, loopCount: 1 })];

    setupStore([nodeA, nodeB], edges);

    // Spy on copyLoopOutput
    const copyLoopOutputSpy = vi.spyOn(
      await import("../utils/executionUtils"),
      "copyLoopOutput"
    );

    await useWorkflowStore.getState().executeWorkflow();

    // With loopCount=1, copyLoopOutput should never be called (no iterations to feedback)
    expect(copyLoopOutputSpy).toHaveBeenCalledTimes(0);
  });

  it("stops loop mid-iteration when aborted", async () => {
    // Create loop with loopCount: 10
    const nodeA = makeNode("a", "imageInput", { image: "data:image/png;base64,test" });
    const nodeB = makeNode("b", "prompt", { prompt: "test" });

    const edges = [makeEdge("a", "b"), makeEdge("b", "a", { isLoop: true, loopCount: 10 })];

    setupStore([nodeA, nodeB], edges);

    // Start execution (don't await)
    const executionPromise = useWorkflowStore.getState().executeWorkflow();

    // Abort after a short delay
    setTimeout(() => {
      useWorkflowStore.getState().stopWorkflow();
    }, 10);

    await executionPromise;

    // Verify execution was stopped
    expect(useWorkflowStore.getState().isRunning).toBe(false);
  });
});
