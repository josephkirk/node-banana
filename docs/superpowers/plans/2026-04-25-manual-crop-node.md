# Manual Crop Node Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a Manual Crop Node that allows users to precisely crop images using a dedicated modal powered by `react-easy-crop`.

**Architecture:** A new node type `crop` with a global `CropModal`. State is managed via a dedicated `useCropStore` for the modal and `useWorkflowStore` for the node data. High-quality cropping is performed using a hidden HTML5 canvas.

**Tech Stack:** Next.js, React Flow, Zustand, react-easy-crop.

---

## Chunk 1: Infrastructure & Types

### Task 1: Install Dependencies
- [ ] **Step 1: Install `react-easy-crop`**
Run: `npm install react-easy-crop`

### Task 2: Define Node Types
- **Modify:** `src/types/nodes.ts`
- [ ] **Step 1: Add `crop` to `NodeType` union**
- [ ] **Step 2: Define `CropNodeData` interface**

```typescript
// src/types/nodes.ts

export type NodeType =
  | "imageInput"
  // ...
  | "crop" // Add this
  // ...

export interface CropNodeData extends BaseNodeData {
  sourceImage: string | null;
  sourceImageDimensions: { width: number; height: number } | null;
  croppedImage: string | null;
  croppedImageRef?: string;
  cropArea: { x: number; y: number; width: number; height: number } | null;
  cropPercent: { x: number; y: number } | null;
  aspectRatio: number | null;
  zoom: number;
  status: NodeStatus;
  error: string | null;
}
```

- [ ] **Step 3: Commit**
```bash
git add src/types/nodes.ts package.json package-lock.json
git commit -m "chore: add crop node type and dependencies"
```

### Task 3: Set Default Data & Dimensions
- **Modify:** `src/store/utils/nodeDefaults.ts`
- [ ] **Step 1: Add dimensions for `crop` node**
```typescript
crop: { width: 300, height: 320 },
```
- [ ] **Step 2: Add default data in `createDefaultNodeData`**
```typescript
case "crop":
  return {
    sourceImage: null,
    sourceImageDimensions: null,
    croppedImage: null,
    cropArea: null,
    cropPercent: null,
    aspectRatio: null,
    zoom: 1,
    status: "idle",
    error: null,
  } as CropNodeData;
```

- [ ] **Step 3: Commit**
```bash
git add src/store/utils/nodeDefaults.ts
git commit -m "feat: add default data and dimensions for crop node"
```

---

## Chunk 2: State Management

### Task 4: Create Crop Store
- **Create:** `src/store/cropStore.ts`
- [ ] **Step 1: Implement `useCropStore`**
Handle modal visibility, current source image, and callback for saving results.

```typescript
import { create } from "zustand";

interface CropState {
  isOpen: boolean;
  nodeId: string | null;
  sourceImage: string | null;
  initialCrop: { x: number; y: number; width: number; height: number } | null;
  initialZoom: number;
  initialAspectRatio: number | null;
  
  openModal: (nodeId: string, sourceImage: string, options?: { 
    cropArea?: any; 
    zoom?: number; 
    aspectRatio?: number | null 
  }) => void;
  closeModal: () => void;
}

export const useCropStore = create<CropState>((set) => ({
  isOpen: false,
  nodeId: null,
  sourceImage: null,
  initialCrop: null,
  initialZoom: 1,
  initialAspectRatio: null,
  
  openModal: (nodeId, sourceImage, options) => set({
    isOpen: true,
    nodeId,
    sourceImage,
    initialCrop: options?.cropArea || null,
    initialZoom: options?.zoom || 1,
    initialAspectRatio: options?.aspectRatio || null,
  }),
  closeModal: () => set({ isOpen: false, nodeId: null, sourceImage: null }),
}));
```

- [ ] **Step 2: Commit**
```bash
git add src/store/cropStore.ts
git commit -m "feat: implement useCropStore for modal management"
```

---

## Chunk 3: UI Components

### Task 5: Implement CropModal
- **Create:** `src/components/modals/CropModal.tsx`
- [ ] **Step 1: Implement UI with `react-easy-crop`**
- [ ] **Step 2: Implement canvas processing logic**

```typescript
// Inside CropModal.tsx -> handleApply
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/png');
};
```

- [ ] **Step 3: Integrate with `useWorkflowStore` to save results**
Use `updateNodeData` and `saveMedia`.

- [ ] **Step 4: Add `CropModal` to `src/app/page.tsx`**

- [ ] **Step 5: Commit**
```bash
git add src/components/modals/CropModal.tsx src/app/page.tsx
git commit -m "feat: implement CropModal with canvas processing"
```

### Task 6: Implement CropNode Component
- **Create:** `src/components/nodes/CropNode.tsx`
- [ ] **Step 1: Implement the node component**

```tsx
// src/components/nodes/CropNode.tsx
export const CropNode = ({ id, data }: { id: string; data: CropNodeData }) => {
  const openModal = useCropStore((s) => s.openModal);
  const isOutOfSync = checkSync(data); // Implementation of sync check

  return (
    <BaseNode id={id} data={data} title="Manual Crop">
      <div className="flex flex-col gap-2 p-2">
        {data.croppedImage ? (
          <img src={data.croppedImage} className="w-full rounded border" />
        ) : (
          <div className="h-40 w-full bg-muted flex items-center justify-center">
            No Image
          </div>
        )}
        <Button 
          size="sm" 
          onClick={() => openModal(id, data.sourceImage!, { 
            cropArea: data.cropArea, 
            zoom: data.zoom, 
            aspectRatio: data.aspectRatio 
          })}
          disabled={!data.sourceImage}
        >
          Edit Crop
        </Button>
        {isOutOfSync && (
          <div className="text-xs text-amber-500 flex items-center gap-1">
            <AlertTriangle size={12} /> Out of Sync
          </div>
        )}
      </div>
    </BaseNode>
  );
};
```

- [ ] **Step 2: Register in `src/components/nodes/index.ts`**
- [ ] **Step 3: Register in `src/components/WorkflowCanvas.tsx`**

- [ ] **Step 4: Commit**
```bash
git add src/components/nodes/CropNode.tsx src/components/nodes/index.ts src/components/WorkflowCanvas.tsx
git commit -m "feat: implement CropNode component"
```

---

## Chunk 4: Logic & Integration

### Task 7: Update Execution Logic & Sync Detection
- **Modify:** `src/store/workflowStore.ts`
- [ ] **Step 1: Implement sync detection logic**
Compare `data.sourceImage` dimensions with the current upstream output.

- [ ] **Step 2: Add execution handler for `crop` node**
If `sourceImage` changes, update the node status to `idle` and flag as out-of-sync.

### Task 8: Update Connection Drop Menu
- **Modify:** `src/components/ConnectionDropMenu.tsx`
- [ ] **Step 1: Add `Crop Image` option**

- [ ] **Step 2: Commit**
```bash
git add src/store/workflowStore.ts src/components/ConnectionDropMenu.tsx
git commit -m "feat: integrate crop node into execution and connection menus"
```

---

## Chunk 5: Verification

### Task 9: Unit Tests for Crop Logic
- **Create:** `src/lib/__tests__/cropUtils.test.ts`
- [ ] **Step 1: Write tests for `getCroppedImg` (mocking canvas)**
- [ ] **Step 2: Run tests**
Run: `npm run test`

### Task 10: Manual Verification
- [ ] **Step 1: Test adding Crop Node**
- [ ] **Step 2: Test opening modal and applying crop**
- [ ] **Step 3: Verify downstream connectivity**
- [ ] **Step 4: Verify Out of Sync detection by changing upstream image size**

- [ ] **Step 5: Commit final changes**
```bash
git commit -m "test: add crop utility tests and final verification"
```
