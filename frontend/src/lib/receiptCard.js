const WIDTH = 640;
const HEIGHT = 960;
const NOTCH_Y = 260;
const NOTCH_R = 16;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fmtAddr(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
}

function fmtTime(ts) {
  return new Date(ts).toLocaleString([], {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function roundedTicketPath(ctx) {
  const r = 24;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(WIDTH - r, 0);
  ctx.arcTo(WIDTH, 0, WIDTH, r, r);
  ctx.lineTo(WIDTH, NOTCH_Y - NOTCH_R);
  ctx.arc(WIDTH, NOTCH_Y, NOTCH_R, -Math.PI / 2, Math.PI / 2, true);
  ctx.lineTo(WIDTH, HEIGHT - r);
  ctx.arcTo(WIDTH, HEIGHT, WIDTH - r, HEIGHT, r);
  ctx.lineTo(r, HEIGHT);
  ctx.arcTo(0, HEIGHT, 0, HEIGHT - r, r);
  ctx.lineTo(0, NOTCH_Y + NOTCH_R);
  ctx.arc(0, NOTCH_Y, NOTCH_R, Math.PI / 2, -Math.PI / 2, true);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();
}

export async function buildReceiptCanvas(config) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0A0E1A";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  roundedTicketPath(ctx);
  ctx.clip();
  ctx.fillStyle = "#10152A";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const barGradient = ctx.createLinearGradient(0, 0, WIDTH, 0);
  barGradient.addColorStop(0, "#0A3FDB");
  barGradient.addColorStop(0.5, "#3D7BFF");
  barGradient.addColorStop(1, "#8FC1FF");
  ctx.fillStyle = barGradient;
  ctx.fillRect(0, 0, WIDTH, 8);

  let y = 70;

  // Small brand mark: two eyes + a curved smile, same as the app logo
  ctx.fillStyle = "#F5F7FF";
  ctx.beginPath();
  ctx.arc(51, y - 9, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(65, y - 9, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#3D7BFF";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(46, y);
  ctx.quadraticCurveTo(58, y + 10, 70, y);
  ctx.stroke();

  ctx.fillStyle = "#F5F7FF";
  ctx.font = "700 26px 'Space Grotesk', sans-serif";
  ctx.fillText("Memes on Arc", 82, y);
  ctx.fillStyle = "#8890A6";
  ctx.font = "500 16px 'JetBrains Mono', monospace";
  const kicker = config.type === "launch" ? "LAUNCH RECEIPT"
    : config.type === "showcase" ? "TOKEN"
    : "TRADE RECEIPT";
  ctx.fillText(kicker, WIDTH - 240, y, 200);

  y += 60;

  const logoSize = 120;
  const logoX = (WIDTH - logoSize) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(WIDTH / 2, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (config.meme?.imageURI) {
    try {
      const img = await loadImage(config.meme.imageURI);
      ctx.drawImage(img, logoX, y, logoSize, logoSize);
    } catch {
      ctx.fillStyle = "#171D38";
      ctx.fillRect(logoX, y, logoSize, logoSize);
    }
  } else {
    ctx.fillStyle = "#171D38";
    ctx.fillRect(logoX, y, logoSize, logoSize);
  }
  ctx.restore();
  ctx.strokeStyle = "#232B4D";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(WIDTH / 2, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
  ctx.stroke();

  y += logoSize + 44;

  ctx.textAlign = "center";
  ctx.fillStyle = "#F5F7FF";
  ctx.font = "700 36px 'Space Grotesk', sans-serif";
  const headline = config.type === "launch"
    ? `Launched $${config.meme.symbol}`
    : config.type === "showcase"
    ? `$${config.meme.symbol}`
    : `${config.action === "buy" ? "Bought" : "Sold"} $${config.meme.symbol}`;
  ctx.fillText(headline, WIDTH / 2, y);

  y += 40;
  ctx.fillStyle = "#8890A6";
  ctx.font = "500 20px 'JetBrains Mono', monospace";
  ctx.fillText(config.meme.name, WIDTH / 2, y);

  ctx.textAlign = "left";
  y += 60;

  ctx.strokeStyle = "#232B4D";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(48, y);
  ctx.lineTo(WIDTH - 48, y);
  ctx.stroke();
  ctx.setLineDash([]);

  y += 50;

  function row(label, value) {
    ctx.fillStyle = "#8890A6";
    ctx.font = "500 18px 'Inter', sans-serif";
    ctx.fillText(label, 48, y);
    ctx.fillStyle = "#F5F7FF";
    ctx.font = "600 18px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(value, WIDTH - 48, y);
    ctx.textAlign = "left";
    y += 42;
  }

  if (config.type === "launch") {
    row("Creator", fmtAddr(config.creator));
    row("Launch fee", config.launchFeeLabel || "N/A");
    row("Date", fmtTime(config.timestamp));
    row("Transaction", fmtAddr(config.txHash));
  } else if (config.type === "showcase") {
    row("Price per token", config.priceUsdc ? `$${config.priceUsdc.toFixed(6)}` : "N/A");
    row("Contract", fmtAddr(config.meme.token));
  } else {
    row(config.action === "buy" ? "Spent" : "Sold", config.action === "buy"
      ? `${config.amountUsdc.toFixed(2)} USDC`
      : `${config.amountTokens.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${config.meme.symbol}`);
    row("Received",
      config.action === "buy"
        ? `${config.amountTokens.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${config.meme.symbol}`
        : `${config.amountUsdc.toFixed(2)} USDC`);
    row("Price per token", `$${config.priceUsdc.toFixed(6)}`);
    row("Trader", fmtAddr(config.trader));
    row("Date", fmtTime(config.timestamp));
    row("Transaction", fmtAddr(config.txHash));
  }

  ctx.restore();

  ctx.strokeStyle = "#232B4D";
  ctx.lineWidth = 1.5;
  roundedTicketPath(ctx);
  ctx.stroke();

  return canvas;
}

export function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
