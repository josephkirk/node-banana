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
