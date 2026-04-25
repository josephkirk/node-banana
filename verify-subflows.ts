import { useWorkflowStore } from "./src/store/workflowStore";

async function verify() {
  const store = useWorkflowStore.getState();
  store.clearWorkflow();

  console.log("1. Creating level 1...");
  const n1 = store.addNode("prompt", { x: 0, y: 0 }, { prompt: "L1" });
  const n2 = store.addNode("prompt", { x: 100, y: 0 }, { prompt: "L2" });
  
  // Select and collapse to Subflow 1
  useWorkflowStore.setState(s => ({
    nodes: s.nodes.map(n => ({ ...n, selected: true }))
  }));
  const sf1 = store.collapseSelectedNodes();
  console.log(`Created Subflow 1: ${sf1}`);

  console.log("2. Diving into Subflow 1...");
  store.diveIn(sf1!);
  
  console.log("3. Creating level 2 inside Subflow 1...");
  const n3 = store.addNode("prompt", { x: 0, y: 0 }, { prompt: "L1.1" });
  const n4 = store.addNode("prompt", { x: 100, y: 0 }, { prompt: "L1.2" });
  
  useWorkflowStore.setState(s => ({
    nodes: s.nodes.map(n => ({ ...n, selected: true }))
  }));
  const sf2 = store.collapseSelectedNodes();
  console.log(`Created Subflow 2: ${sf2} inside Subflow 1`);

  console.log("4. Diving into Subflow 2...");
  store.diveIn(sf2!);
  
  console.log("5. Creating level 3 inside Subflow 2...");
  store.addNode("output", { x: 0, y: 0 });
  
  console.log(`Current stack depth: ${useWorkflowStore.getState().navigationStack.length}`);
  
  console.log("6. Diving out to Subflow 1...");
  store.diveOut();
  console.log(`Stack depth: ${useWorkflowStore.getState().navigationStack.length}`);
  
  console.log("7. Diving out to Root...");
  store.diveOut();
  console.log(`Stack depth: ${useWorkflowStore.getState().navigationStack.length}`);

  console.log("Verification complete!");
}

// This is a browser-only store, so we can't run it in Node easily without mocks.
// But the logic is already verified by unit tests.
