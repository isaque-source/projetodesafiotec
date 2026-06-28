/**
 * Compresses a Base64 image data URL or File using HTML5 Canvas.
 * Automatically resizes the image so that neither its width nor its height exceeds the specified maximums.
 * Converts to a highly compressed JPEG format.
 *
 * @param base64Data The original Base64 string / Data URL.
 * @param maxWidth The maximum width of the output image.
 * @param maxHeight The maximum height of the output image.
 * @param quality JPEG quality from 0.1 to 1.0.
 * @returns A promise that resolves to the compressed Base64 JPEG Data URL.
 */
export function compressImage(
  base64Data: string,
  maxWidth: number = 600,
  maxHeight: number = 600,
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    // If it's not a valid base64 data URL or is already small, return it as-is
    if (!base64Data || !base64Data.startsWith("data:image")) {
      resolve(base64Data);
      return;
    }

    const img = new Image();
    img.src = base64Data;

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Only resize if the image actually exceeds the limit
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
      }

      try {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(base64Data); // Fallback if 2d context is unavailable
          return;
        }

        // Draw image onto the canvas (this resizes it)
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas content to JPEG data URL with quality compression
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.error("[ImageCompression] Error during canvas compression:", err);
        resolve(base64Data); // Fallback to original image
      }
    };

    img.onerror = (err) => {
      console.error("[ImageCompression] Failed to load image element:", err);
      resolve(base64Data); // Fallback to original image
    };
  });
}
