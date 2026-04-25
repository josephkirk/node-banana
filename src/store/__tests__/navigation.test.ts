import { describe, it, expect, beforeEach } from "vitest";
import { useWorkflowStore } from "../workflowStore";

describe("Workflow Navigation", () => {
  beforeEach(() => {
    useWorkflowStore.getState().clearWorkflow();
  });

  it("should initialize with an empty navigation stack", () => {
    const state = useWorkflowStore.getState();
    expect(state.navigationStack).toEqual([]);
  });

  it("should push to navigation stack when diving in", () => {
    const { addNode, diveIn } = useWorkflowStore.getState();
    const sfId = addNode("subflow", { x: 0, y: 0 });
    
    diveIn(sfId);
    
    const state = useWorkflowStore.getState();
    expect(state.navigationStack).toHaveLength(1);
    expect(state.navigationStack[0].parentId).toBe(sfId);
  });

  it("should pop from navigation stack when diving out", () => {
    const { addNode, diveIn, diveOut } = useWorkflowStore.getState();
    const sf1 = addNode("subflow", { x: 0, y: 0 });
    
    diveIn(sf1);
    
    // Add another subflow inside the first one
    const sf2 = addNode("subflow", { x: 100, y: 0 });
    diveIn(sf2);
    
    expect(useWorkflowStore.getState().navigationStack).toHaveLength(2);
    
    diveOut();
    expect(useWorkflowStore.getState().navigationStack).toHaveLength(1);
    expect(useWorkflowStore.getState().navigationStack[0].parentId).toBe(sf1);
    
    diveOut();
    expect(useWorkflowStore.getState().navigationStack).toHaveLength(0);
  });

  it("should do nothing when diving out of root", () => {
    const { diveOut } = useWorkflowStore.getState();
    diveOut();
    
    const state = useWorkflowStore.getState();
    expect(state.navigationStack).toEqual([]);
  });
});
