/// Resizes and compresses an image file entirely client-side, returning a
/// data URI. Used for token logos and profile avatars since there's no
/// pinning/upload backend — keeping the image small matters because this
/// string gets stored on-chain.
const DEFAULT_MAX_DIMENSION = 256;
const JPEG_QUALITY = 0.82;

export function fileToLogoDataUri(file, maxDimension = DEFAULT_MAX_DIMENSION) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't read that image"));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        const dataUri = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        resolve(dataUri);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
