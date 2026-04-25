"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import { useCropStore } from "@/store/cropStore";
import { useWorkflowStore } from "@/store/workflowStore";
import { externalizeWorkflowMedia } from "@/utils/mediaStorage";
import { cropImage, createImage } from "@/utils/imageCrop";


const ASPECT_RATIOS = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
];

export function CropModal() {
  const {
    isOpen,
    nodeId,
    sourceImage,
    initialCrop,
    initialZoom,
    initialAspectRatio,
    closeModal,
  } = useCropStore();

  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialZoom || 1);
  const [aspectRatio, setAspectRatio] = useState<number | null>(initialAspectRatio);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(initialZoom || 1);
      setAspectRatio(initialAspectRatio);
      // We don't sync 'crop' directly because initialCrop is in pixels (pixelCrop)
      // and 'crop' state for react-easy-crop is in percentages.
      // react-easy-crop usually handles initial fitting itself.
    }
  }, [isOpen, initialZoom, initialAspectRatio]);

  const onCropComplete = useCallback((_unmountedArea: Area, _croppedAreaPixels: Area) => {
    setCroppedAreaPixels(_croppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!nodeId || !sourceImage || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const base64Image = await cropImage(sourceImage, croppedAreaPixels);
      const image = await createImage(sourceImage);
      
      // Update workflow store
      updateNodeData(nodeId, {
        sourceImage,
        sourceImageDimensions: { width: image.width, height: image.height },
        croppedImage: base64Image,
        cropArea: croppedAreaPixels,
        cropPercent: crop,
        aspectRatio,
        zoom,
        status: "complete",
        error: null,
      });

      // Trigger externalization
      const workflowState = useWorkflowStore.getState();
      if (workflowState.useExternalImageStorage && workflowState.saveDirectoryPath) {
        await externalizeWorkflowMedia(useWorkflowStore.getState, updateNodeData);
      }

      closeModal();
    } catch (err) {
      console.error("Cropping failed:", err);
      updateNodeData(nodeId, {
        status: "error",
        error: err instanceof Error ? err.message : "Failed to crop image",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !sourceImage) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col">
      {/* Top Bar */}
      <div className="h-14 bg-neutral-900 flex items-center justify-between px-4 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-white">Edit Crop</h2>
          <div className="flex items-center gap-1">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.label}
                onClick={() => setAspectRatio(ratio.value)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded transition-colors ${
                  aspectRatio === ratio.value
                    ? "bg-white text-neutral-900"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={closeModal}
            disabled={isProcessing}
            className="px-4 py-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isProcessing}
            className="px-4 py-1.5 text-xs font-medium bg-white text-neutral-900 rounded hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-3 h-3 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              "Apply Crop"
            )}
          </button>
        </div>
      </div>

      {/* Main Cropper Area */}
      <div className="flex-1 relative bg-neutral-900 overflow-hidden">
        <Cropper
          image={sourceImage}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio || undefined}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          minZoom={1}
          maxZoom={5}
          restrictPosition={true}
        />
      </div>

      {/* Bottom Control Bar */}
      <div className="h-16 bg-neutral-900 flex items-center justify-center px-4 border-t border-neutral-800">
        <div className="flex items-center gap-4 w-full max-w-md">
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Zoom</span>
          <input
            type="range"
            min={1}
            max={5}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <span className="text-[10px] text-neutral-400 font-mono w-8">{zoom.toFixed(1)}x</span>
          <button
            onClick={() => {
              setZoom(1);
              setCrop({ x: 0, y: 0 });
            }}
            className="ml-4 px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
