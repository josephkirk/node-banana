"use client";

import { useCallback, useMemo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useCropStore } from "@/store/cropStore";
import { useWorkflowStore } from "@/store/workflowStore";
import { CropNodeData } from "@/types";
import { useAdaptiveImageSrc } from "@/hooks/useAdaptiveImageSrc";
import { downloadMedia } from "@/utils/downloadMedia";
import { useShowHandleLabels } from "@/hooks/useShowHandleLabels";
import { HandleLabel } from "./HandleLabel";

type CropNodeType = Node<CropNodeData, "crop">;

export function CropNode({ id, data, selected }: NodeProps<CropNodeType>) {
  const nodeData = data;
  const openModal = useCropStore((state) => state.openModal);
  const getConnectedInputs = useWorkflowStore((state) => state.getConnectedInputs);
  const showLabels = useShowHandleLabels(selected);

  // Retrieve upstream image
  const { images } = getConnectedInputs(id);
  const upstreamImage = images.length > 0 ? images[0] : null;

  // Change detection: Is the current crop out of sync with the upstream image?
  const isOutOfSync = useMemo(() => {
    if (!upstreamImage || !nodeData.sourceImage) return false;
    // Simple URL/Data comparison. If the upstream image has changed since the last crop,
    // we mark it as out of sync.
    return upstreamImage !== nodeData.sourceImage;
  }, [upstreamImage, nodeData.sourceImage]);

  const handleEdit = useCallback(() => {
    const imageToCrop = upstreamImage || nodeData.sourceImage;
    if (!imageToCrop) {
      alert("No image available. Connect an image to crop.");
      return;
    }
    openModal(id, imageToCrop, {
      cropArea: nodeData.cropArea,
      zoom: nodeData.zoom,
      aspectRatio: nodeData.aspectRatio,
    });
  }, [id, nodeData, upstreamImage, openModal]);

  const displayImage = nodeData.croppedImage;
  const adaptiveDisplayImage = useAdaptiveImageSrc(displayImage, id);

  return (
    <BaseNode
      id={id}
      selected={selected}
      contentClassName="flex-1 min-h-0"
      aspectFitMedia={nodeData.croppedImage}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="image"
        data-handletype="image"
      />
      <HandleLabel label="Image" side="target" color="var(--handle-color-image)" visible={showLabels} />
      
      <Handle
        type="source"
        position={Position.Right}
        id="image"
        data-handletype="image"
      />
      <HandleLabel label="Image" side="source" color="var(--handle-color-image)" visible={showLabels} />

      <div className="flex flex-col h-full">
        {/* Preview Area */}
        <div 
          className="relative group flex-1 bg-neutral-900/40 rounded-lg overflow-hidden cursor-pointer min-h-[200px]"
          onClick={handleEdit}
        >
          {displayImage ? (
            <>
              <img
                src={adaptiveDisplayImage ?? undefined}
                alt="Cropped preview"
                className="w-full h-full object-contain"
              />
              
              {/* Overlay Actions */}
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadMedia(displayImage!, "cropped-image");
                  }}
                  className="w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                  title="Download"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>

              {/* Aspect Ratio Badge */}
              {nodeData.aspectRatio !== null && (
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-[10px] font-mono text-white/80">
                  {nodeData.aspectRatio === 1 ? "1:1" : 
                   nodeData.aspectRatio === 4/3 ? "4:3" : 
                   nodeData.aspectRatio === 16/9 ? "16:9" : 
                   nodeData.aspectRatio === 9/16 ? "9:16" : "Custom"}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500">
              <svg className="w-10 h-10 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
              <span className="text-xs">
                {upstreamImage ? "Click to crop" : "Connect source image"}
              </span>
            </div>
          )}

          {/* Out of Sync Warning */}
          {isOutOfSync && (
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-amber-500/90 rounded text-[10px] font-bold text-black animate-in fade-in zoom-in duration-200">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.34c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              OUT OF SYNC
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleEdit}
          disabled={!upstreamImage && !nodeData.sourceImage}
          className="mt-3 w-full py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
          {displayImage ? "Edit Crop" : "Open Cropper"}
        </button>
      </div>
    </BaseNode>
  );
}
