# Design Spec: Float Input Node

## 1. Overview
The **Float Input Node** allows users to provide numeric values to their workflows using various interactive UI elements. These values can be used as variables (`@var`) in Prompt and Prompt Constructor nodes, or passed directly to numeric inputs of other nodes.

## 2. Requirements
- **Interactive UI:** Supports three display modes:
  - **Slider:** A horizontal slider for quick range adjustments.
  - **Spinner:** A numeric input field with increment/decrement buttons.
  - **Rotator:** A circular dial/knob for angular or specialized numeric input.
- **Variable Integration:** 
  - Each node has a `variableName` field.
  - When set, the value is available as `@variableName` in Prompt and Prompt Constructor nodes.
- **Range Configuration:** Users can set `min`, `max`, and `step` values for the input.
- **Subflow Compatibility:** Can be exposed as a subflow input handle using the existing "Expose as Input" mechanic.

## 3. Architecture & Data Flow
- **Component:** `FloatInputNode.tsx`.
- **Node Data:**
  ```typescript
  export interface FloatInputNodeData extends BaseNodeData {
    value: number;
    variableName?: string;
    displayType: "slider" | "spinner" | "rotator";
    min: number;
    max: number;
    step: number;
    label?: string;
  }
  ```
- **Variable Resolution:** 
  - Update `PromptConstructorNode` and `PromptNode` variable scanning logic to include `FloatInputNode`s.

## 4. UI Details
- **Slider:** Uses a custom styled range input or Radix Slider.
- **Spinner:** Uses a numeric input with custom styling for the controls.
- **Rotator:** A custom SVG-based knob component that tracks mouse drag to rotate and update the value.
- **Settings:** Controls for min/max/step and switching the display type.

## 5. Integration
- Added to `FloatingActionBar` under a new "Inputs" or "Parameters" category.
- Output handle type: `float` (compatible with generic text/numeric inputs).
