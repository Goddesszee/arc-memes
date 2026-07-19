const WIDTH = 1200;
const HEIGHT = 630;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/// Draws a 1200x630 (standard social-card size) PNG for a meme: logo,
/// name/symbol, price, and a holo-gradient accent bar matching the app's
/// branding. Returns a Blob ready for download or navigator.share.
export async function buildShareCard(meme, priceUsdc) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#0A1416";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Holo gradient accent bar at the top
  const barGradient = ctx.createLinearGradient(0, 0, WIDTH, 0);
  barGradient.addColorStop(0, "#00E5D0");
  barGradient.addColorStop(0.5, "#FF3EA5");
  barGradient.addColorStop(1, "#FFD166");
  ctx.fillStyle = barGradient;
  ctx.fillRect(0, 0, WIDTH, 10);

  // Soft glow behind the logo
  const glow = ctx.createRadialGradient(220, 300, 20, 220, 300, 260);
  glow.addColorStop(0, "rgba(0, 229, 208, 0.25)");
  glow.addColorStop(1, "rgba(0, 229, 208, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Logo (circular)
  const logoSize = 220;
  const logoX = 110;
  const logoY = 190;
  ctx.save();
  ctx.beginPath();
  ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (meme.imageURI) {
    try {
      const img = await loadImage(meme.imageURI);
      ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
    } catch {
      ctx.fillStyle = "#17262C";
      ctx.fillRect(logoX, logoY, logoSize, logoSize);
    }
  } else {
    ctx.fillStyle = "#17262C";
    ctx.fillRect(logoX, logoY, logoSize, logoSize);
  }
  ctx.restore();
  ctx.strokeStyle = "#1E2E35";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Name
  ctx.fillStyle = "#EAF6F5";
  ctx.font = "700 64px 'Space Grotesk', sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(meme.name, 400, 280);

  // Symbol
  ctx.fillStyle = "#7C9499";
  ctx.font = "500 36px 'JetBrains Mono', monospace";
  ctx.fillText(`$${meme.symbol}`, 400, 330);

  // Price
  ctx.fillStyle = "#00E5D0";
  ctx.font = "700 52px 'JetBrains Mono', monospace";
  const priceLabel = priceUsdc ? `$${priceUsdc.toFixed(6)}` : "pre-launch";
  ctx.fillText(priceLabel, 400, 420);
  ctx.fillStyle = "#7C9499";
  ctx.font = "400 26px 'Inter', sans-serif";
  ctx.fillText("per token", 400, 455);

  // Footer branding
  ctx.fillStyle = "#EAF6F5";
  ctx.font = "700 30px 'Space Grotesk', sans-serif";
  ctx.fillText("Arc Memes", 110, 560);
  ctx.fillStyle = "#7C9499";
  ctx.font = "400 24px 'Inter', sans-serif";
  ctx.fillText("Launch & trade memes on Arc", 300, 560);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export async function shareOrDownload(meme, priceUsdc) {
  const blob = await buildShareCard(meme, priceUsdc);
  const file = new File([blob], `${meme.symbol}-arcmemes.png`, { type: "image/png" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: `$${meme.symbol} on Arc Memes`,
      text: `Check out $${meme.symbol} on Arc Memes`,
    });
    return "shared";
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${meme.symbol}-arcmemes.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return "downloaded";
}
