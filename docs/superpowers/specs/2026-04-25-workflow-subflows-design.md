# Design Spec: Workflow Sub-flows & Node Collapsing

## 1. Overview
This feature allows users to organize complex workflows by "collapsing" clusters of nodes into a single, reusable **SubFlow Node**. These sub-flows can be navigated, edited, and shared as standalone JSON files.

## 2. Requirements
- **Collapse to Subflow:** A "Collapse" button in the `FloatingActionBar` (visible when 2+ nodes are selected) that converts the selection into a `SubFlow` node.
- **Inline by Default:** Initial collapsing stores the subgraph JSON data directly within the `SubFlow` node's data.
- **Expose Inputs/Outputs:** Right-click internal nodes to expose them as handles on the parent `SubFlow` node.
    - Only `Input` (Image, Audio, Video) and `Prompt` nodes can be exposed as inputs.
    - `Output` nodes can be exposed as outputs.
- **Deep Navigation:** Double-click a `SubFlow` node to "Dive In" to its internal canvas (swaps the workspace view).
- **Breadcrumb Navigation:** A top-level UI element to return to the parent canvas.
- **Save to File:** The `SubFlow` node features a "Save to File" button.
    - Prompts user to save the subgraph as a `.json` file.
    - **Post-Save Option:** User can choose to "Link to File" (reference the external path) or "Stay Inline" (keep the data in the main workflow).
- **Execution:** Recursive topological sort support for nested graphs.

## 3. Architecture & Data Flow
- **Component:** `SubFlow` node type.
- **State Management:**
    - `useWorkflowStore`: Extended with `navigationStack` to track nested levels.
    - `currentView`: The ID of the subflow currently being edited (null for Root).
- **Data Structure:**
    ```typescript
    export interface SubFlowNodeData extends BaseNodeData {
      subgraph?: WorkflowData;        // Inline JSON storage (default)
      externalPath?: string;          // Path to external .json file
      isLinked: boolean;              // Whether to use externalPath or subgraph
      interfaceMapping: {
        inputs: { [externalHandleId: string]: string },  // handleId -> internalNodeId
        outputs: { [externalHandleId: string]: string }  // handleId -> internalNodeId
      }
    }
    ```

## 4. User Interface Designs
- **FloatingActionBar:**
    - New **"Collapse"** button.
- **SubFlow Node:**
    - Compact node showing sub-flow name.
    - Dynamic input/output handles.
    - "Save to File" action in the node's control panel.
    - Status indicator (Inline vs. Linked).
- **Breadcrumbs:**
    - `Root / [Subflow Name]` appearing at the top of the canvas during "Dive In" mode.

## 5. Implementation Details
- **Execution Engine:**
    - The `executeSubFlow` function will resolve the source graph (either from `subgraph` or by reading `externalPath`), inject inputs, run the internal sort, and return mapped outputs.
- **Diving In:**
    - When "Diving In", the store filters the displayed `nodes` and `edges` based on the subgraph's content.

## 6. Testing Strategy
- **Unit Tests:** Verify topological sort works correctly on nested structures.
- **Integration Tests:** Test the collapse/un-collapse logic ensuring no data loss.
- **Persistence Tests:** Ensure sub-flows save and load correctly from JSON, and switching between Inline/Linked states works seamlessly.
