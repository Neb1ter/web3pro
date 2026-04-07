import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Expand, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

type ZoomableImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  wrapperClassName?: string;
  buttonLabel?: string;
  loading?: "eager" | "lazy";
  decoding?: "async" | "sync" | "auto";
  fetchPriority?: "high" | "low" | "auto";
  sizes?: string;
  objectFit?: "cover" | "contain";
};

type Point = {
  x: number;
  y: number;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.2;

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

function distanceBetweenTouches(touchA: Touch, touchB: Touch) {
  const deltaX = touchB.clientX - touchA.clientX;
  const deltaY = touchB.clientY - touchA.clientY;
  return Math.hypot(deltaX, deltaY);
}

export function ZoomableImage({
  src,
  alt,
  className,
  imageClassName,
  wrapperClassName,
  buttonLabel,
  loading = "lazy",
  decoding = "async",
  fetchPriority = "auto",
  sizes,
  objectFit = "cover",
}: ZoomableImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(MIN_SCALE);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const titleId = useId();
  const dragOriginRef = useRef<{
    pointerX: number;
    pointerY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const pinchStateRef = useRef<{
    distance: number;
    scale: number;
  } | null>(null);

  const resetZoom = () => {
    setScale(MIN_SCALE);
    setOffset({ x: 0, y: 0 });
    dragOriginRef.current = null;
    pinchStateRef.current = null;
    setIsDragging(false);
  };

  const closeViewer = () => {
    setIsOpen(false);
    resetZoom();
  };

  const updateScale = (nextScale: number) => {
    const clampedScale = clampScale(nextScale);
    setScale(clampedScale);
    if (clampedScale === MIN_SCALE) {
      setOffset({ x: 0, y: 0 });
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeViewer();
      }
    };

    const handlePointerUp = () => {
      dragOriginRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mouseup", handlePointerUp);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      resetZoom();
    }
  }, [isOpen]);

  if (!src) return null;

  return (
    <>
      <div className={cn("group relative", wrapperClassName)}>
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full",
            objectFit === "contain" ? "object-contain" : "object-cover",
            className,
            imageClassName,
          )}
          loading={loading}
          decoding={decoding}
          fetchPriority={fetchPriority}
          sizes={sizes}
        />
        <button
          type="button"
          aria-label={buttonLabel || "View image fullscreen"}
          onClick={() => setIsOpen(true)}
          className="tap-target absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-950/70 text-white shadow-lg backdrop-blur-sm transition hover:border-cyan-300/60 hover:bg-slate-900"
        >
          <Expand className="h-4 w-4" />
        </button>
      </div>
      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <ZoomableImageDialog
              src={src}
              alt={alt}
              titleId={titleId}
              scale={scale}
              offset={offset}
              isDragging={isDragging}
              onClose={closeViewer}
              onScaleChange={updateScale}
              onOffsetChange={setOffset}
              onDragStateChange={setIsDragging}
              dragOriginRef={dragOriginRef}
              pinchStateRef={pinchStateRef}
              onReset={resetZoom}
            />,
            document.body,
          )
        : null}
    </>
  );
}

type ZoomableImageDialogProps = {
  src: string;
  alt: string;
  titleId: string;
  scale: number;
  offset: Point;
  isDragging: boolean;
  onClose: () => void;
  onScaleChange: (nextScale: number) => void;
  onOffsetChange: (nextOffset: Point) => void;
  onDragStateChange: (dragging: boolean) => void;
  dragOriginRef: React.MutableRefObject<{
    pointerX: number;
    pointerY: number;
    offsetX: number;
    offsetY: number;
  } | null>;
  pinchStateRef: React.MutableRefObject<{
    distance: number;
    scale: number;
  } | null>;
  onReset: () => void;
};

function ZoomableImageDialog({
  src,
  alt,
  titleId,
  scale,
  offset,
  isDragging,
  onClose,
  onScaleChange,
  onOffsetChange,
  onDragStateChange,
  dragOriginRef,
  pinchStateRef,
  onReset,
}: ZoomableImageDialogProps) {
  const startDrag = (clientX: number, clientY: number) => {
    if (scale <= MIN_SCALE) return;
    dragOriginRef.current = {
      pointerX: clientX,
      pointerY: clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    onDragStateChange(true);
  };

  const continueDrag = (clientX: number, clientY: number) => {
    if (!dragOriginRef.current || scale <= MIN_SCALE) return;

    onOffsetChange({
      x: dragOriginRef.current.offsetX + (clientX - dragOriginRef.current.pointerX),
      y: dragOriginRef.current.offsetY + (clientY - dragOriginRef.current.pointerY),
    });
  };

  const finishDrag = () => {
    dragOriginRef.current = null;
    onDragStateChange(false);
  };

  const handleWheelZoom = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const direction = event.deltaY < 0 ? 0.24 : -0.24;
    onScaleChange(scale + direction);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (scale <= MIN_SCALE) return;
    event.preventDefault();
    startDrag(event.clientX, event.clientY);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    continueDrag(event.clientX, event.clientY);
  };

  const handleDoubleClick = () => {
    if (scale > MIN_SCALE) {
      onReset();
      return;
    }
    onScaleChange(DOUBLE_TAP_SCALE);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      pinchStateRef.current = {
        distance: distanceBetweenTouches(event.touches[0], event.touches[1]),
        scale,
      };
      finishDrag();
      return;
    }

    pinchStateRef.current = null;

    if (event.touches.length === 1) {
      startDrag(event.touches[0].clientX, event.touches[0].clientY);
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2 && pinchStateRef.current) {
      event.preventDefault();
      const nextDistance = distanceBetweenTouches(event.touches[0], event.touches[1]);
      const ratio = nextDistance / pinchStateRef.current.distance;
      onScaleChange(pinchStateRef.current.scale * ratio);
      return;
    }

    if (event.touches.length === 1) {
      if (scale <= MIN_SCALE) return;
      event.preventDefault();
      continueDrag(event.touches[0].clientX, event.touches[0].clientY);
    }
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 1 && scale > MIN_SCALE) {
      pinchStateRef.current = null;
      startDrag(event.touches[0].clientX, event.touches[0].clientY);
      return;
    }

    pinchStateRef.current = null;
    finishDrag();
  };

  return (
    <div
      className="fixed inset-0 z-[1200] bg-slate-950/92 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-[#07111f] shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:m-4 sm:h-[calc(100vh-2rem)] sm:w-[calc(100%-2rem)] sm:rounded-[28px] sm:border sm:border-white/10"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-3 text-sm text-slate-300 sm:px-4">
          <div className="min-w-0">
            <div id={titleId} className="truncate font-medium text-slate-100">
              {alt}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              双击、双指缩放或使用下方按钮查看细节
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap-target inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/30 hover:bg-white/10"
            aria-label="Close fullscreen image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-white/10 px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2 text-slate-200">
            <button
              type="button"
              onClick={() => onScaleChange(scale - 0.25)}
              className="tap-target inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-cyan-300/50 hover:bg-white/10"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <div className="min-w-[72px] rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center text-sm font-medium">
              {Math.round(scale * 100)}%
            </div>
            <button
              type="button"
              onClick={() => onScaleChange(scale + 0.25)}
              className="tap-target inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-cyan-300/50 hover:bg-white/10"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onReset}
              className="tap-target inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-medium transition hover:border-cyan-300/50 hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
              重置
            </button>
          </div>
        </div>

        <div
          className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_38%)] p-1 sm:p-4"
          onMouseMove={handleMouseMove}
          onMouseUp={finishDrag}
          onMouseLeave={finishDrag}
          onWheel={handleWheelZoom}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: scale > MIN_SCALE ? "none" : "manipulation" }}
        >
          <img
            src={src}
            alt={alt}
            className={cn(
              "max-h-full max-w-full select-none object-contain transition-transform duration-150 ease-out",
              isDragging ? "cursor-grabbing" : scale > MIN_SCALE ? "cursor-grab" : "cursor-zoom-in",
            )}
            loading="eager"
            decoding="async"
            draggable={false}
            onMouseDown={handleMouseDown}
            style={{
              maxHeight: "calc(100vh - 11rem)",
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
              transformOrigin: "center center",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ZoomableImage;
