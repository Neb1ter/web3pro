/**
 * Markdown Component
 *
 * ⚠️ 性能关键说明：
 * streamdown 及其依赖（mermaid 69MB、shiki 等）体积极大，会导致 vendor-misc chunk 超过 13MB。
 * 本组件使用动态 import() 懒加载 Streamdown，确保首屏和非文章页面完全不加载这些大型库。
 * 只有当用户实际访问 ArticleDetail 等使用 Markdown 的页面时，才会触发加载。
 *
 * ⚠️ 禁止将此组件改回静态 import！否则会导致所有页面加载时间增加 10+ 秒。
 *
 * @see https://streamdown.ai/docs - Streamdown Documentation
 */

import { memo, useState, useEffect, type ReactNode, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// DEFAULT COMPONENT OVERRIDES
// ============================================================================

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
    <img src={src} alt={alt || ""} className="max-w-full h-auto rounded-lg my-4" loading="lazy" />
  ),
};

// ============================================================================
// 懒加载 Streamdown 类型定义
// ============================================================================

type StreamdownModule = typeof import("streamdown");
type StreamdownProps = ComponentProps<StreamdownModule["Streamdown"]>;

type MarkdownProps = Omit<StreamdownProps, "components"> & {
  components?: Partial<typeof components>;
  enableCode?: boolean;
  enableMermaid?: boolean;
};

// ============================================================================
// MARKDOWN COMPONENT（懒加载版本）
// ============================================================================

/**
 * Markdown - 生产级 Markdown 渲染组件（懒加载版）
 *
 * ⚠️ 重要：streamdown 通过动态 import() 懒加载，首次渲染时会短暂显示骨架屏。
 * 这是为了避免 vendor-misc chunk 体积过大（13MB）导致所有页面加载缓慢。
 */
export const Markdown = memo(function Markdown({
  className,
  children,
  components: customComponents,
  shikiTheme = ["github-light", "github-dark"],
  controls = true,
  enableCode = true,
  enableMermaid = true,
  ...props
}: MarkdownProps) {
  const [StreamdownComp, setStreamdownComp] = useState<StreamdownModule["Streamdown"] | null>(null);

  useEffect(() => {
    // 动态加载 streamdown，只在组件挂载时触发一次
    import("streamdown").then((mod) => {
      setStreamdownComp(() => mod.Streamdown);
    });
  }, []);

  if (!StreamdownComp) {
    // 加载中：显示骨架屏，避免布局跳动
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
    <StreamdownComp
      className={cn("text-foreground leading-relaxed", className)}
      components={{ ...components, ...customComponents }}
      shikiTheme={shikiTheme}
      controls={controls}
      {...props}
    >
      {children}
    </StreamdownComp>
  );
});

// Export individual components for custom composition
export { components as markdownComponents };
export default Markdown;
