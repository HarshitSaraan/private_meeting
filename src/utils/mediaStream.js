// Utility to generate clean video streams for peer participants in web sessions

export function createPeerVideoStream(name, color = '#1a73e8') {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  let angle = 0;
  let animId = null;

  function renderFrame() {
    // Solid dark background matching Google Meet tiles (#202124) with no grid lines
    ctx.fillStyle = '#202124';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    angle += 0.04;
    const pulseRadius = 65 + Math.sin(angle) * 4;

    // Smooth glowing avatar circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Participant Initial Letter
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.charAt(0).toUpperCase(), centerX, centerY);

    animId = requestAnimationFrame(renderFrame);
  }

  renderFrame();

  const stream = canvas.captureStream(30);
  
  stream._cleanup = () => {
    if (animId) cancelAnimationFrame(animId);
  };

  return stream;
}
