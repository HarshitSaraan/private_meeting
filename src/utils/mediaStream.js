// Utility to generate dynamic media streams for peer participants in multi-tab / web sessions

export function createPeerVideoStream(name, color = '#1a73e8') {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  let angle = 0;
  let animId = null;

  function renderFrame() {
    // Dark video background
    ctx.fillStyle = '#1e1f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle animated grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Central pulsing video avatar / camera preview
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    angle += 0.05;
    const pulseRadius = 70 + Math.sin(angle) * 6;

    // Glowing circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Initial Letter
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.charAt(0).toUpperCase(), centerX, centerY);

    // Live Camera Badge
    ctx.fillStyle = '#34a853';
    ctx.beginPath();
    ctx.arc(30, 30, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('LIVE VIDEO FEED', 46, 34);

    animId = requestAnimationFrame(renderFrame);
  }

  renderFrame();

  const stream = canvas.captureStream(30);
  
  // Attach cleanup helper to stream
  stream._cleanup = () => {
    if (animId) cancelAnimationFrame(animId);
  };

  return stream;
}
