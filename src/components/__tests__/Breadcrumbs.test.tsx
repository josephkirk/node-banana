import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Breadcrumbs } from "../Breadcrumbs";
import { useWorkflowStore } from "@/store/workflowStore";

// Mock React for the Fragment
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
  };
});

describe("Breadcrumbs", () => {
  beforeEach(() => {
    useWorkflowStore.getState().clearWorkflow();
    vi.clearAllMocks();
  });

  it("should not render when navigation stack is empty", () => {
    const { container } = render(<Breadcrumbs />);
    expect(container.firstChild).toBeNull();
  });

  it("should render path when in a subflow", () => {
    useWorkflowStore.setState({ 
      navigationStack: [{ parentId: "subflow-1", nodes: [], edges: [], groups: {} }] 
    });
    
    render(<Breadcrumbs />);
    
    expect(screen.getByText("Root")).toBeInTheDocument();
    expect(screen.getByText("Subflow 1")).toBeInTheDocument();
  });

  it("should navigate back when Root is clicked", () => {
    const diveOutSpy = vi.spyOn(useWorkflowStore.getState(), "diveOut");
    useWorkflowStore.setState({ 
        navigationStack: [
          { parentId: "subflow-1", nodes: [], edges: [], groups: {} },
          { parentId: "subflow-2", nodes: [], edges: [], groups: {} }
        ],
        diveOut: diveOutSpy 
    });
    
    render(<Breadcrumbs />);
    
    const rootButton = screen.getByText("Root");
    fireEvent.click(rootButton);
    
    // Should call diveOut twice to get back to root
    expect(diveOutSpy).toHaveBeenCalledTimes(2);
  });

  it("should navigate to intermediate level when clicked", () => {
    const diveOutSpy = vi.spyOn(useWorkflowStore.getState(), "diveOut");
    useWorkflowStore.setState({ 
        navigationStack: [
          { parentId: "subflow-1", nodes: [], edges: [], groups: {} },
          { parentId: "subflow-2", nodes: [], edges: [], groups: {} },
          { parentId: "subflow-3", nodes: [], edges: [], groups: {} }
        ],
        diveOut: diveOutSpy 
    });
    
    render(<Breadcrumbs />);
    
    const level1Button = screen.getByText("Subflow 1");
    fireEvent.click(level1Button);
    
    // stack is [1, 2, 3], index of "Subflow 1" in path is 1.
    // popsNeeded = 3 - 1 = 2
    expect(diveOutSpy).toHaveBeenCalledTimes(2);
  });
});
