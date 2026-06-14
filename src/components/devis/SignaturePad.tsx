"use client";

import { useEffect, useRef } from "react";

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  className?: string;
}

const PEN_COLOR = "#000000";
const PAPER_BG = "#ffffff";

/** Zone de signature tactile — trait noir sur fond blanc (WYSIWYG PDF). */
export function SignaturePad({ onChange, className = "" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasStrokeRef = useRef(false);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = PAPER_BG;
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = PEN_COLOR;

    function pos(e: MouseEvent | TouchEvent) {
      const r = canvas!.getBoundingClientRect();
      if ("touches" in e) {
        const t = e.touches[0] ?? e.changedTouches[0];
        return { x: t.clientX - r.left, y: t.clientY - r.top };
      }
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function start(e: MouseEvent | TouchEvent) {
      e.preventDefault();
      drawingRef.current = true;
      const p = pos(e);
      ctx!.beginPath();
      ctx!.moveTo(p.x, p.y);
    }

    function move(e: MouseEvent | TouchEvent) {
      if (!drawingRef.current) return;
      e.preventDefault();
      const p = pos(e);
      ctx!.lineTo(p.x, p.y);
      ctx!.stroke();
      hasStrokeRef.current = true;
      onChangeRef.current(canvas!.toDataURL("image/png"));
    }

    function end() {
      drawingRef.current = false;
      if (hasStrokeRef.current) onChangeRef.current(canvas!.toDataURL("image/png"));
    }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mouseleave", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("mouseleave", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", end);
    };
  }, []);

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = PAPER_BG;
    ctx.fillRect(0, 0, rect.width, rect.height);
    hasStrokeRef.current = false;
    onChangeRef.current(null);
  }

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        className="h-32 w-full cursor-crosshair touch-none rounded-lg border border-gray-300 bg-white"
        aria-label="Zone de signature"
      />
      <button
        type="button"
        onClick={clear}
        className="mt-2 text-xs text-gray-500 underline-offset-2 hover:underline"
      >
        Effacer la signature
      </button>
    </div>
  );
}
