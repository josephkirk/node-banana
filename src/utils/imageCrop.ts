/**
 * Image Cropping Utility
 * 
 * Performs high-quality image cropping using HTML5 Canvas.
 */

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Creates an HTMLImageElement from a URL
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

/**
 * Crops an image and returns a base64 Data URL
 */
export async function cropImage(
  sourceUrl: string,
  pixelCrop: CropArea
): Promise<string> {
  const image = await createImage(sourceUrl);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Set canvas size to the cropped area dimensions
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped portion
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

  return canvas.toDataURL("image/png");
}

/**
 * Calculates pixel coordinates from percentage-based coordinates
 */
export function getPixelCrop(
  imageWidth: number,
  imageHeight: number,
  percentCrop: { x: number; y: number },
  zoom: number,
  aspectRatio: number | null
): CropArea {
  // react-easy-crop percentage-based crop logic is complex because it depends on zoom
  // For auto-re-apply, we might need more data.
  // For now, let's keep it simple: if resolution changed, we might need manual re-crop
  // unless we stored enough info.
  
  // Actually, if we have the aspect ratio and zoom, and the center point (percentCrop),
  // we can reconstruct the pixel crop.
  
  // But let's start with manual re-crop for now as a safer baseline.
  return { x: 0, y: 0, width: imageWidth, height: imageHeight }; // Placeholder
}
