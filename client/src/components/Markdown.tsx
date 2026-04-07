import { memo, useEffect, useState, type ComponentProps, type ComponentType, type ReactNode } from "react";
import { scheduleIdle } from "@/lib/routePreload";
import { cn } from "@/lib/utils";
import { ZoomableImage } from "@/components/ZoomableImage";

const components = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="text-3xl font-semibold tracking-tight mt-8 mb-4 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="text-xl font-semibold tracking-tight mt-6 mb-3 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }: { children?: ReactNode }) => (
    <h4 className="text-lg font-semibold mt-6 mb-2 first:mt-0">{children}</h4>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-4 leading-7 last:mb-0">{children}</p>
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-4 decoration-muted-foreground/50 hover:decoration-foreground transition-colors"
    >
      {children}
    </a>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }: { children?: ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="leading-7">{children}</li>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="border-l-2 border-muted-foreground/30 pl-4 italic text-muted-foreground my-4">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-border my-8" />,
  table: ({ children }: { children?: ReactNode }) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: ReactNode }) => <thead>{children}</thead>,
  tbody: ({ children }: { children?: ReactNode }) => <tbody>{children}</tbody>,
  tr: ({ children }: { children?: ReactNode }) => (
    <tr className="border-b border-border">{children}</tr>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td className="border border-border px-4 py-2">{children}</td>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <ZoomableImage
      src={src}
      alt={alt || ""}
      className="max-w-full h-auto rounded-lg my-4"
      loading="lazy"
      decoding="async"
      objectFit="contain"
      buttonLabel={alt ? `放大查看 ${alt}` : "放大查看图片"}
    />
  ),
};

type PlainCodeProps = {
  children?: ReactNode;
  className?: string;
};

function PlainCode({ children, className }: PlainCodeProps) {
  const text = typeof children === "string"
    ? children
    : Array.isArray(children)
      ? children.join("")
      : children;
  const isBlock = typeof text === "string" && text.includes("\n");

  if (isBlock) {
    return (
      <pre className="my-4 overflow-x-auto rounded-2xl border border-border/70 bg-slate-950/80 p-4 text-sm leading-6 text-slate-100">
        <code className={cn("font-mono", className)}>{text}</code>
      </pre>
    );
  }

  return (
    <code className={cn("rounded bg-muted px-1.5 py-0.5 font-mono text-sm", className)}>
      {children}
    </code>
  );
}

type StreamdownModule = typeof import("streamdown");
type StreamdownProps = ComponentProps<StreamdownModule["Streamdown"]>;
type StreamdownRuntimeProps = StreamdownProps & { cdnUrl?: string | null };
type MarkdownControls = StreamdownProps["controls"];

type MarkdownProps = Omit<StreamdownProps, "components"> & {
  components?: Partial<typeof components>;
  enableCode?: boolean;
  enableMermaid?: boolean;
};

const MERMAID_FENCE_RE = /(?:^|\n)(```|~~~)\s*mermaid\b[^\n]*\n/i;
const CODE_FENCE_RE = /(?:^|\n)(```|~~~)(?!\s*mermaid\b)[^\n]*\n/i;
const SHIKI_LANG_CDN_URL = "https://cdn.jsdelivr.net/npm/@shikijs/langs@3.23.0/dist";

let streamdownModulePromise: Promise<StreamdownModule> | null = null;

function loadStreamdownModule() {
  streamdownModulePromise ??= import("streamdown");
  return streamdownModulePromise;
}

function detectMarkdownFeatureFlags(children: ReactNode) {
  if (typeof children !== "string") {
    return null;
  }

  return {
    hasCodeFence: CODE_FENCE_RE.test(children),
    hasMermaidFence: MERMAID_FENCE_RE.test(children),
  };
}

function resolveControlsConfig(
  controls: MarkdownControls | undefined,
  shouldEnableCode: boolean,
  shouldEnableMermaid: boolean,
): MarkdownControls {
  if (controls === false) {
    return false;
  }

  if (controls === true || controls == null) {
    return {
      table: true,
      code: shouldEnableCode,
      mermaid: shouldEnableMermaid,
    };
  }

  return {
    table: controls.table ?? true,
    code: shouldEnableCode ? (controls.code ?? true) : false,
    mermaid: shouldEnableMermaid ? (controls.mermaid ?? true) : false,
  };
}

export const Markdown = memo(function Markdown({
  className,
  children,
  components: customComponents,
  mode = "static",
  parseIncompleteMarkdown = false,
  shikiTheme = ["github-light", "github-dark"],
  controls,
  mermaid,
  enableCode,
  enableMermaid,
  ...props
}: MarkdownProps) {
  const [StreamdownComp, setStreamdownComp] = useState<StreamdownModule["Streamdown"] | null>(null);
  const featureFlags = detectMarkdownFeatureFlags(children);
  const shouldEnableCode = enableCode ?? featureFlags?.hasCodeFence ?? false;
  const shouldEnableMermaid = enableMermaid ?? featureFlags?.hasMermaidFence ?? false;
  const resolvedControls = resolveControlsConfig(controls, shouldEnableCode, shouldEnableMermaid);
  const RuntimeStreamdown = StreamdownComp as unknown as ComponentType<StreamdownRuntimeProps>;
  const usePlainCodeRenderer = !shouldEnableCode && !(featureFlags?.hasMermaidFence ?? false);
  const runtimeComponents = usePlainCodeRenderer
    ? { ...components, code: PlainCode, pre: ({ children }: { children?: ReactNode }) => <>{children}</>, ...customComponents }
    : { ...components, ...customComponents };

  useEffect(() => {
    let isCancelled = false;
    const cancelIdle = scheduleIdle(() => {
      void loadStreamdownModule().then((mod) => {
        if (!isCancelled) {
          setStreamdownComp(() => mod.Streamdown);
        }
      });
    }, shouldEnableCode || shouldEnableMermaid ? 900 : 300);

    return () => {
      isCancelled = true;
      cancelIdle();
    };
  }, [shouldEnableCode, shouldEnableMermaid]);

  if (!StreamdownComp) {
    return (
      <div className={cn("text-foreground leading-relaxed animate-pulse", className)}>
        <div className="h-4 bg-muted rounded w-3/4 mb-3" />
        <div className="h-4 bg-muted rounded w-full mb-3" />
        <div className="h-4 bg-muted rounded w-5/6 mb-3" />
        <div className="h-4 bg-muted rounded w-2/3 mb-3" />
      </div>
    );
  }

  return (
    <RuntimeStreamdown
      className={cn("text-foreground leading-relaxed", className)}
      components={runtimeComponents}
      mode={mode}
      parseIncompleteMarkdown={parseIncompleteMarkdown}
      shikiTheme={shouldEnableCode ? shikiTheme : undefined}
      cdnUrl={shouldEnableCode ? SHIKI_LANG_CDN_URL : null}
      mermaid={shouldEnableMermaid ? mermaid : undefined}
      controls={resolvedControls}
      {...props}
    >
      {children}
    </RuntimeStreamdown>
  );
});

export { components as markdownComponents };
export default Markdown;
