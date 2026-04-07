import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Expand, X } from "lucide-react";
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
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
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
            <div
              className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/92 p-4 backdrop-blur-md"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={() => setIsOpen(false)}
            >
              <div
                className="relative flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#07111f] shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 text-sm text-slate-300">
                  <div id={titleId} className="min-w-0 truncate font-medium">
                    {alt}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="tap-target inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/30 hover:bg-white/10"
                    aria-label="Close fullscreen image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_38%)] p-3 sm:p-6">
                  <img
                    src={src}
                    alt={alt}
                    className="max-h-[82vh] w-auto max-w-full rounded-2xl object-contain"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export default ZoomableImage;
