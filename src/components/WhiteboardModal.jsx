import React, { useRef, useState, useEffect } from 'react';
import { 
  X, Pen, Eraser, Trash2, Download, Circle, Square, 
  Minus, Type, Undo, Redo, Palette, Sparkles, Layers 
} from 'lucide-react';

export default function WhiteboardModal({ isOpen, onClose }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen', 'eraser', 'rect', 'circle', 'line', 'text'
  const [color, setColor] = useState('#1a73e8');
  const [brushSize, setBrushSize] = useState(3);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState(null);

  const colors = [
    '#ffffff', '#1a73e8', '#ea4335', '#34a853', 
    '#fbbc04', '#a142f4', '#ff7043', '#00acc1'
  ];

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * 2; // HiDPI double resolution
      canvas.height = rect.height * 2;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      
      // Default dark canvas background
      ctx.fillStyle = '#1e1f23';
      ctx.fillRect(0, 0, rect.width, rect.height);

      contextRef.current = ctx;
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!contextRef.current) return;
    contextRef.current.strokeStyle = tool === 'eraser' ? '#1e1f23' : color;
    contextRef.current.lineWidth = tool === 'eraser' ? brushSize * 4 : brushSize;
  }, [color, brushSize, tool]);

  if (!isOpen) return null;

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const coords = getCanvasCoords(e);
    const ctx = contextRef.current;
    if (!ctx) return;

    if (tool === 'text') {
      setTextPos(coords);
      return;
    }

    setIsDrawing(true);
    setStartPos(coords);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);

    // Save canvas snapshot for shape previewing
    const canvas = canvasRef.current;
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    const ctx = contextRef.current;
    if (!ctx) return;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (snapshot) {
      // Restore previous snapshot to clear shape outline preview
      ctx.putImageData(snapshot, 0, 0);
      ctx.beginPath();

      if (tool === 'line') {
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(coords.x, coords.y);
      } else if (tool === 'rect') {
        ctx.rect(startPos.x, startPos.y, coords.x - startPos.x, coords.y - startPos.y);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(coords.x - startPos.x, 2) + Math.pow(coords.y - startPos.y, 2)
        );
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      }
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const ctx = contextRef.current;
    if (ctx) ctx.closePath();
    setIsDrawing(false);
    setSnapshot(null);
  };

  const handleAddText = () => {
    if (!textInput.trim() || !textPos || !contextRef.current) return;
    const ctx = contextRef.current;
    ctx.font = `${brushSize * 6}px Outfit, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(textInput, textPos.x, textPos.y);
    setTextInput('');
    setTextPos(null);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (canvas && ctx) {
      ctx.fillStyle = '#1e1f23';
      ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `meet-whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-5xl h-[85vh] bg-[#202124] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Whiteboard Header Toolbar */}
        <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-[#28292c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Interactive Whiteboard</h3>
              <p className="text-xs text-slate-400">Draw ideas, sketch diagrams & collaborate</p>
            </div>
          </div>

          {/* Tools Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-[#1c1d20] rounded-xl border border-white/10">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                tool === 'pen' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Pen Tool"
            >
              <Pen className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                tool === 'eraser' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Eraser Tool"
            >
              <Eraser className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool('line')}
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                tool === 'line' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Straight Line"
            >
              <Minus className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool('rect')}
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                tool === 'rect' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool('circle')}
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                tool === 'circle' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Circle"
            >
              <Circle className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool('text')}
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                tool === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Add Text"
            >
              <Type className="w-4 h-4" />
            </button>
          </div>

          {/* Color Palette & Brush Size */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => { setColor(c); if(tool === 'eraser') setTool('pen'); }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    color === c && tool !== 'eraser' ? 'scale-125 border-white' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Brush Size Slider */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Size:</span>
              <input
                type="range"
                min="1"
                max="15"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20 accent-blue-500"
              />
            </div>
          </div>

          {/* Canvas Actions */}
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <button
              onClick={handleClear}
              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all text-xs font-semibold flex items-center gap-1"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>

            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-[#2d2f31] hover:bg-[#3c4043] text-white border border-white/10 transition-all text-xs font-semibold flex items-center gap-1"
              title="Download PNG Image"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas Workspace */}
        <div className="relative flex-1 w-full h-full bg-[#1e1f23] overflow-hidden cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full touch-none"
          />

          {/* Text Input Popup when Text tool is active */}
          {textPos && (
            <div 
              className="absolute z-20 bg-[#28292c] p-3 rounded-xl border border-blue-500 shadow-2xl flex items-center gap-2"
              style={{ left: textPos.x, top: textPos.y }}
            >
              <input
                type="text"
                autoFocus
                placeholder="Type text here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddText(); }}
                className="input-field py-1 text-sm font-medium"
              />
              <button
                onClick={handleAddText}
                className="btn btn-primary py-1 px-3 text-xs"
              >
                Add
              </button>
              <button
                onClick={() => setTextPos(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
