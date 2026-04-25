# Design Spec: Manual Crop Node

## 1. Overview
The Manual Crop Node allows users to precisely crop an image using a dedicated modal workspace. This node is essential for focusing on specific subjects within generated images or preparing reference images for downstream processing.

## 2. Requirements
- **Source Image Input:** Accepts a single image handle as input.
- **Crop Modal:** A large-scale workspace that opens when the user clicks "Edit Crop".
- **Interaction:** Smooth zoom, pan, and crop area selection using `react-easy-crop`.
- **Aspect Ratio Locking:** Support for presets (1:1, 4:3, 16:9, 9:16) and free-form cropping.
- **Output:** Produces a high-quality cropped version of the original image.
- **State Persistence:** Saves crop settings within the node data for future adjustments.

## 3. Architecture & Data Flow
- **Component:** `CropNode.tsx` (Canvas Node) and `CropModal.tsx` (Global Modal).
- **State Management:**
    - `useWorkflowStore`: Stores node-specific data.
    - `useCropStore` (new): Manages modal visibility and current editing session state.
- **Externalization:** Uses the project's `mediaStorage.ts` utility to store the cropped image result as an external file (`imageRef`). This ensures performance remains high and state remains lean.
- **Execution:**
    - The node displays a thumbnail of the cropped image.
    - **Change Detection:** The node stores the metadata of the image it was cropped from (`sourceImageDimensions`). If the upstream image changes resolution or source, the node enters an "Out of Sync" state (status: `idle`, warning indicator shown).
    - Downstream nodes consume the `croppedImageRef` (primary) or `croppedImage` (fallback/preview).

## 4. Data Model
Added to `src/types/nodes.ts`:
```typescript
export interface CropNodeData extends BaseNodeData {
  sourceImage: string | null;            // Last used source image URL/data
  sourceImageDimensions: {               // Used for change detection
    width: number;
    height: number;
  } | null;
  croppedImage: string | null;           // Local preview / Data URL
  croppedImageRef?: string;              // Primary storage reference
  cropArea: {                            // react-easy-crop "pixelCrop" format (absolute)
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  cropPercent: {                         // react-easy-crop "crop" format (percentages)
    x: number;
    y: number;
  } | null;
  aspectRatio: number | null;            // null for free-form
  zoom: number;                          // Saved zoom level
  status: NodeStatus;                    // Standard node status (idle, loading, complete, error)
  error: string | null;                  // Standard error message field
}
```

## 5. User Interface Designs
- **Canvas Node:**
    - Standard `BaseNode` frame.
    - Preview area showing the cropped image.
    - "Edit Crop" button (Action).
    - Aspect ratio badge (e.g., "16:9").
    - "Out of Sync" warning icon if the source image has changed since the last crop.
- **Crop Modal:**
    - Semi-transparent dark overlay.
    - Main cropping area powered by `react-easy-crop`.
    - Toolbar with:
        - Aspect Ratio Toggle: [Free] [1:1] [4:3] [16:9] [9:16]
        - Zoom Slider: 1x to 5x
        - Reset Button: Resets crop to fit image
        - Cancel / Apply Buttons

## 6. Implementation Details
- **Library:** `react-easy-crop` for the UI logic.
- **Processing:** Using a hidden `<canvas>` element created during the "Apply" step.
    - Draw the original image to canvas at full scale.
    - Use `ctx.drawImage` with source coordinates (x, y, w, h) to extract the crop.
    - Call `canvas.toDataURL('image/png')` for the output.
- **Externalization:** The base64 output will be passed to `saveMedia` to generate an `imageRef`.
- **CORS Handling:** If source images are from external URLs, we will use an `img.crossOrigin = 'anonymous'` approach. If that fails (due to lack of CORS headers on source), we will surface a "Tainted Canvas" error.

## 7. Error Handling & Edge Cases
- **Large Images:** If the image is extremely large, canvas creation might fail. We will cap the processing resolution to 4096px if needed.
- **Invalid Source:** If the source node is disconnected or the image is deleted, the node will reset to `idle` with an error message "Source image missing".
- **Out of Sync:** When "Out of Sync" is detected, we will attempt to re-apply the percentage-based crop automatically if possible, otherwise force a manual re-edit.

## 8. Testing Strategy
- **Unit Tests:** Verify crop coordinate calculations and canvas extraction logic.
- **Integration Tests:** Ensure workflow execution correctly passes the cropped image to downstream nodes.
- **UI Tests:** Test modal opening/closing and tool interactions (zoom, preset switching).
