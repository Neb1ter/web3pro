import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useScrollMemory } from "@/hooks/useScrollMemory";

// ============================================================
// SEO 对话记录数据
// ============================================================
const chatData = [
  {
    role: "user",
    content: "我的网站部署早get8.pro我希望能取一个好的网站标题名字，对于seo能有好的优化",
  },
  {
    role: "assistant",
    content:
      "感谢您的请求！为了帮您取一个SEO友好的网站标题，我需要了解更多信息：\n\n1. **网站内容/主题**：您的网站主要是做什么的？（例如：电商平台、博客、SaaS工具、资讯门户等）\n\n2. **目标受众**：您的主要用户群体是什么？（例如：全球用户、特定国家、特定行业人群）\n\n3. **主要关键词**：您希望网站在搜索引擎中排名的主要关键词有哪些？\n\n4. **品牌定位**：您希望网站给用户什么样的印象？（例如：专业、创新、便捷、高端等）\n\n5. **语言**：网站主要使用什么语言？（中文、英文、还是多语言？）\n\n如果您暂时还没想好这些细节，我可以根据域名 get8.pro 的特点，为您提供一些通用的SEO优化建议和标题示例。请告诉我您的想法！",
  },
  {
    role: "user",
    content: "web3科普，币圈交易所返佣，拉新返佣，交易所各个板块的扫盲，中英切换",
  },
  {
    role: "assistant",
    content:
      "感谢您提供详细信息！我已经了解您的网站定位：\n\n- **内容主题**：Web3科普、币圈交易所返佣、拉新返佣、交易所各板块教程\n- **功能特性**：中英文切换\n- **域名**：get8.pro\n\n现在我为您分析并提供SEO优化的标题建议。",
  },
  {
    role: "assistant",
    content:
      "我已经为您的网站 **get8.pro** 完成了一份详细的SEO优化标题方案与综合建议报告。\n\n## 📋 报告核心内容\n\n**中文标题方案**（3套）：\n- **方案一**：强调返佣优势 → \"Get8 Pro | 全网最高交易所返佣 - 永久返现，省心省力\"\n- **方案二**：聚焦教育属性 → \"Get8 Pro | 您的Web3领路人 - 从入门到精通的币圈交易所教程\"\n- **方案三**：综合一站式 → \"Get8 Pro - Web3教程, 交易所返佣, 币圈入门一站式平台\"\n\n**英文标题方案**（3套）：\n- **Option 1**：Max Crypto Exchange Rebates - Lifetime Cashback & Easy Guide\n- **Option 2**：Your Guide to Web3 - Crypto Exchange Tutorials for Beginners\n- **Option 3**：Web3 Tutorials, Exchange Rebates & Crypto Guides\n\n## 🎯 核心优化建议\n\n1. **关键词策略**：核心词（交易所返佣、Web3教程）→ 次核心词（币安返佣、OKX返佣）→ 长尾词（如何获得最高返佣等）\n\n2. **技术SEO**：实施hreflang标签（中英双语）、优化移动端、添加结构化数据标记\n\n3. **内容策略**：创建高质量教育内容、开发工具类内容（计算器等）、建立反向链接\n\n4. **社区运营**：在Reddit、Twitter等平台积极参与，建立品牌影响力",
  },
  {
    role: "user",
    content:
      "网站标题 (Title): Get8 Pro - Web3教程, 交易所返佣, 币圈入门一站式平台\n网站副标题/标语 (Tagline): 探索Web3世界，获取最高交易返佣——从Get8 Pro开始。\n英文标语：Get 8,Get Pro\n\nSite Title: Get8 Pro | Your Guide to Web3 - Crypto Exchange Tutorials for Beginners\nTagline: Learn Web3, Blockchain, and Crypto All in One Place. Master Exchanges with Our Guides & Tips.\n\n请在源代码中进行修改，并配置反向链接",
  },
  {
    role: "assistant",
    content:
      "所有修改已成功提交到 GitHub 仓库 `Neb1ter/web3pro`！以下是本次完整的变更汇总：\n\n## ✅ 已完成的修改\n\n### 1. 网站标题与标语更新\n\n| 位置 | 修改内容 |\n|---|---|\n| `<title>` 标签 | **Get8 Pro - Web3教程, 交易所返佣, 币圈入门一站式平台** |\n| 中文首页主标题 | 欢迎来到 **Get8 Pro** |\n| 中文副标题 | Web3教程, 交易所返佣, 币圈入门一站式平台 |\n| 中文标语 | 探索Web3世界，获取最高交易返佣——从Get8 Pro开始。 |\n| 英文首页主标题 | Welcome to **Get8 Pro** |\n| 英文副标题 | Your Guide to Web3 - Crypto Exchange Tutorials for Beginners |\n| 英文标语 | **Get 8, Get Pro.** Learn Web3, Blockchain, and Crypto All in One Place. |\n\n### 2. SEO 元标签配置（`index.html`）\n- `meta description`（中文优化）\n- `meta keywords`（中英双语关键词）\n- `canonical` 标准链接\n- `hreflang` 双语标签（zh / en / x-default）\n- **Open Graph** 标签（微信/Facebook/LinkedIn 分享优化）\n- **Twitter Card** 标签\n- **JSON-LD 结构化数据**（WebSite + BreadcrumbList）\n\n### 3. 反向链接 SEO 配置\n- `sitemap.xml`：覆盖全站所有重要页面，含优先级和更新频率\n- `robots.txt`：指导搜索引擎爬取，指向 sitemap",
  },
];

// ============================================================
// 渲染 Markdown 风格内容
// ============================================================
function renderContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 标题
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-yellow-400 mt-4 mb-2">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-cyan-400 mt-3 mb-1">
          {line.slice(4)}
        </h3>
      );
    }
    // 表格
    else if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const headerCells = tableLines[0]
        .split("|")
        .filter((c) => c.trim())
        .map((c) => c.trim());
      const bodyRows = tableLines.slice(2).map((row) =>
        row
          .split("|")
          .filter((c) => c.trim())
          .map((c) => c.trim())
      );
      elements.push(
        <div key={i} className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                {headerCells.map((cell, ci) => (
                  <th key={ci} className="text-left py-2 px-3 text-slate-400 font-semibold">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri} className="border-b border-slate-800/50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="py-2 px-3 text-slate-300">
                      <span dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }
    // 列表项
    else if (line.startsWith("- ") || line.match(/^\d+\./)) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].match(/^\d+\./))) {
        listItems.push(lines[i]);
        i++;
      }
      elements.push(
        <ul key={i} className="space-y-1 my-2 pl-2">
          {listItems.map((item, li) => {
            const text = item.replace(/^[-\d.]+\s/, "");
            return (
              <li key={li} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-yellow-500 mt-0.5 flex-shrink-0">•</span>
                <span dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white'>$1</strong>").replace(/`(.*?)`/g, "<code class='bg-slate-800 px-1 rounded text-cyan-400 text-xs'>$1</code>") }} />
              </li>
            );
          })}
        </ul>
      );
      continue;
    }
    // 空行
    else if (line.trim() === "") {
      elements.push(<div key={i} className="h-1" />);
    }
    // 普通文本
    else {
      elements.push(
        <p key={i} className="text-sm text-slate-300 leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white font-semibold'>$1</strong>").replace(/`(.*?)`/g, "<code class='bg-slate-800 px-1 rounded text-cyan-400 text-xs'>$1</code>") }} />
        </p>
      );
    }
    i++;
  }
  return elements;
}

// ============================================================
// 页面组件
// ============================================================
export default function SeoGuide() {
  useScrollMemory();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#050D1A] text-white">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <span className="text-slate-400 hover:text-yellow-400 transition-colors cursor-pointer flex items-center gap-1.5 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回首页
            </span>
          </Link>
          <span className="text-slate-700">/</span>
          <span className="text-slate-300 text-sm font-medium">SEO 优化指南</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 文章头部 */}
        <div
          className="mb-8 text-center"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
            SEO 实战案例
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-tight">
            如何为 Get8 Pro 网站
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)" }}
            >
              选择优化的 SEO 标题
            </span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            本文记录了 Get8 Pro 网站 SEO 标题优化的完整对话过程，包括标题方案制定、元标签配置、反向链接策略等核心内容。
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
            <span>📅 2026年2月</span>
            <span>·</span>
            <span>🏷️ SEO / Web3 / 交易所</span>
            <span>·</span>
            <span>⏱ 约 5 分钟阅读</span>
          </div>
        </div>

        {/* 对话内容 */}
        <div className="space-y-4">
          {chatData.map((item, index) => {
            const isUser = item.role === "user";
            return (
              <div
                key={index}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(12px)",
                  transition: `opacity 0.4s ease ${index * 0.05}s, transform 0.4s ease ${index * 0.05}s`,
                }}
              >
                {/* 头像 */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-lg"
                  style={{
                    background: isUser
                      ? "linear-gradient(135deg, #3b82f6, #60a5fa)"
                      : "linear-gradient(135deg, #10b981, #34d399)",
                  }}
                >
                  {isUser ? "我" : "M"}
                </div>

                {/* 气泡 */}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                    isUser
                      ? "rounded-tr-sm bg-blue-900/40 border border-blue-800/40"
                      : "rounded-tl-sm bg-slate-800/60 border border-slate-700/40"
                  }`}
                >
                  {renderContent(item.content)}
                </div>
              </div>
            );
          })}
        </div>

        {/* 底部 CTA */}
        <div className="mt-12 p-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 text-center">
          <h3 className="text-lg font-bold text-white mb-2">想要获取专属返佣链接？</h3>
          <p className="text-slate-400 text-sm mb-4">
            通过 Get8 Pro 注册五大主流交易所，享受永久个性化手续费返佣
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/crypto-saving">
              <span className="px-5 py-2.5 rounded-xl font-bold text-sm text-black cursor-pointer transition-all hover:scale-105 active:scale-95 inline-block"
                style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)" }}>
                查看省钱攻略 →
              </span>
            </Link>
            <Link href="/exchange-guide">
              <span className="px-5 py-2.5 rounded-xl font-bold text-sm text-white cursor-pointer transition-all hover:scale-105 active:scale-95 border border-slate-600 hover:border-slate-400 inline-block">
                交易所扫盲指南
              </span>
            </Link>
          </div>
        </div>

        {/* 相关文章 */}
        <div className="mt-8 pt-8 border-t border-slate-800">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">相关内容</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: "Web3 入圈指南", desc: "从零开始了解区块链与 DeFi", href: "/web3-guide", icon: "🌐" },
              { title: "交易所扫盲指南", desc: "深度拆解五大交易所功能", href: "/exchange-guide", icon: "📖" },
              { title: "币圈省钱指南", desc: "永久个性化手续费返佣", href: "/crypto-saving", icon: "💰" },
              { title: "下载交易所", desc: "手把手注册与下载教程", href: "/exchange-download", icon: "📱" },
            ].map((item, i) => (
              <Link key={i} href={item.href}>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-800/40 transition-all cursor-pointer group">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-yellow-400 transition-colors">{item.title}</div>
                    <div className="text-xs text-slate-500">{item.desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
