# Web3Pro 项目 AI 协作指南与结构分析报告

欢迎协助开发和维护 Web3Pro 项目！这份文档旨在帮助任何接手此项目的 AI 助手快速了解项目架构、核心特性以及历史遗留的易错点，以避免在未来的开发中踩坑。

## 1. 项目概览

Web3Pro 是一个为 Web3 专业交易者提供的导航平台，提供官方认证的交易所返佣、基于权威数据的客观评测以及加密货币资讯和学习路径。

**技术栈：**
- **前端**：React 19 + Vite + TailwindCSS + Radix UI + Wouter (路由) + React Query
- **后端**：Node.js + Express + tRPC + Drizzle ORM + MySQL
- **构建与部署**：通过 GitHub Actions 自动构建，并将产物通过 SCP/SSH 部署到百度云 Windows 服务器，使用 PM2 进行进程管理。

## 2. 核心特性与架构

- **全栈类型安全**：通过 tRPC 实现了前后端类型共享，路由定义在 `server/routers.ts`，前端通过 `@trpc/client` 调用。
- **国际化 (i18n)**：前端通过 `contexts/LanguageContext.tsx` 实现双语（中/英）支持。所有新增的 UI 组件和数据（如 `quizConst.ts`）都**必须**支持双语。
- **性能优化**：
  - 前端路由级懒加载（`React.lazy`）
  - Gzip + Brotli 双重压缩（在 `vite.config.ts` 中配置）
  - `QueryClient` 配置了较长的缓存时间（`staleTime: 5min`, `gcTime: 30min`），减少重复请求。

## 3. 历史易错点与避坑指南（极其重要）

在之前的开发中，我们遇到过一些严重的构建和渲染问题，请在修改代码时务必注意：

### ⚠️ 3.1 Vite `manualChunks` 循环依赖导致的首屏白屏
**问题描述**：曾因配置不当导致 Rollup 打包时出现 `Circular chunk` 警告，最终导致线上环境首屏完全白屏（`index.js` 无法正确加载 `vendor-react`）。
**根本原因**：`react-dom` 内部依赖 `scheduler` 包。如果将 `scheduler` 打包进了 `vendor-misc`，而 `react-dom` 在 `vendor-react` 中，就会形成循环依赖：`index.js -> vendor-react -> vendor-misc -> vendor-react`。
**解决规则**：
- 在 `vite.config.ts` 的 `manualChunks` 配置中，**必须**将 `scheduler` 和 `react`, `react-dom` 放在同一个 chunk（`vendor-react`）中。
- **不要**过度细分第三方包（如单独分出 radix-ui 或 trpc），这极易引发新的循环依赖。除了 React 核心外，其他所有 `node_modules` 统一归入 `vendor-misc`。

### ⚠️ 3.2 tRPC 路由参数限制导致的数据不显示
**问题描述**：前端 `CryptoNews.tsx` 页面曾出现数据无法加载的问题，无报错但列表为空。
**根本原因**：前端请求参数为 `limit: 80`，但后端 `server/routers.ts` 中通过 Zod 定义的验证规则为 `.max(50)`。tRPC 验证失败，静默返回空或报错。
**解决规则**：
- 修改前端请求的 `limit` 参数时，**必须**同步检查 `server/routers.ts` 中的 Zod schema（如 `z.number().min(1).max(100)`），确保前端请求值在后端允许的范围内。

### ⚠️ 3.3 硬编码中文导致的国际化失效
**问题描述**：学习路径（`LearningPath.tsx`）和测评页面（`Web3Quiz.tsx`）在切换语言为英语时，内容仍然显示中文。
**根本原因**：页面和数据文件（`quizConst.ts`）中大量硬编码了中文文本。
**解决规则**：
- 任何面向用户的文本，都必须通过 `useLanguage` hook 判断当前语言（`const { language } = useLanguage(); const zh = language === "zh";`）进行渲染。
- 数据结构（如数组、常量）必须包含中英文字段（如 `title` 和 `titleEn`）。

### ⚠️ 3.4 Content Security Policy (CSP) 阻止外部脚本加载
**问题描述**：浏览器控制台报错 `violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline'"`，导致 Microsoft Clarity 和 Cloudflare Web Analytics 脚本被拦截。
**根本原因**：后端 `server/_core/security.ts` 中的 Helmet CSP 配置过于严格，没有将这些第三方分析工具的域名加入 `scriptSrc` 白名单。
**解决规则**：
- 引入任何新的外部脚本（如在 `index.html` 中添加 `<script src="https://example.com/...">`）时，**必须**同步更新 `server/_core/security.ts` 中的 `helmet` CSP 配置，将该域名（如 `example.com`）加入 `scriptSrc` 数组。

### ⚠️ 3.5 首屏加载极慢（vendor-misc 体积过大）
**问题描述**：网站所有页面加载都需要等待 2-3 秒以上，网络面板显示 `vendor-misc-xxx.js` 文件体积高达 13MB。
**根本原因**：`streamdown`（44MB 源码）、`mermaid`（69MB 源码）等超大型库被静态 `import` 到了组件中，且 `vite.config.ts` 的 `manualChunks` 将所有 `node_modules` 强制归入了 `vendor-misc`。导致即使用户访问不需要这些库的首页，也被迫下载它们。
**解决规则**：
1. **组件层**：对于重型库（如 markdown 渲染、图表、代码高亮），**必须**使用 `React.lazy` 和动态 `import()` 进行懒加载，绝不能在顶层静态 `import`。
2. **构建层**：在 `vite.config.ts` 的 `manualChunks` 中，**必须**将这些大型库排除在 `vendor-misc` 的匹配规则之外（返回 `undefined`），让 Rollup 根据动态 import 自动为它们生成独立的懒加载 chunk。
3. **后端层**：高频但低变化的 API（如 `exchanges.list`、`news.list`），应使用 `server/_core/cache.ts` 中的 `withCache` 进行内存缓存，减少数据库查询时间。

## 4. 目录结构说明

```text
web3pro/
├── client/                 # 前端代码
│   ├── public/             # 静态资源 (图片、数据JSON)
│   └── src/
│       ├── components/     # 复用 UI 组件 (基于 Radix UI 构建)
│       ├── contexts/       # React Context (如 LanguageContext)
│       ├── hooks/          # 自定义 Hooks
│       ├── lib/            # 工具函数、常量 (如 quizConst.ts, i18n.ts)
│       ├── pages/          # 页面组件 (每个路由对应一个文件)
│       ├── App.tsx         # 根组件、路由配置、React Query 配置
│       └── main.tsx        # 前端入口文件
├── server/                 # 后端代码
│   ├── _core/              # 核心配置 (Express, tRPC setup)
│   ├── db.ts               # 数据库操作逻辑 (Drizzle ORM)
│   ├── index.ts            # 后端入口文件
│   └── routers.ts          # tRPC 路由定义 (API 接口)
├── shared/                 # 前后端共享代码
│   └── schema.ts           # 数据库 Schema 定义 (Drizzle)
├── backend/                # 遗留/备用后端逻辑 (主要业务在 server 目录下)
├── ecosystem.config.cjs    # PM2 部署配置文件
└── vite.config.ts          # Vite 构建配置 (极其关键，详见 3.1)
```

## 5. 开发工作流建议

1. **环境启动**：
   - 依赖安装：`pnpm install`（如果遇到依赖冲突，尝试 `npm install --legacy-peer-deps`）
   - 开发环境：不要直接在沙箱运行服务器。请在沙箱中修改代码并进行类型检查（`npx tsc --noEmit`）和构建测试（`npm run build`）。
2. **代码修改规范**：
   - 尽量保持组件职责单一。
   - 涉及到前后端交互的，先在 `shared/schema.ts` 或 `server/routers.ts` 定义好类型。
3. **部署**：
   - 代码提交到 `main` 分支后，GitHub Actions 会自动触发构建并部署到百度云服务器。
   - 部署完成后，请访问 `https://get8.pro/` 验证修改是否生效，特别是检查控制台是否有错误，网络请求是否正常。

---
*此文档由 Manus AI 自动生成并维护，旨在提高 AI 协作效率。*

### 3.6 每日内容自动化与 SEO 优化
**功能描述**：为提升网站 SEO 权重，系统引入了每日内容自动化机制（`server/_core/dailyContent.ts`）。
**核心机制**：
- **快讯补充**：每天定时检查，若当日抓取的快讯不足 5 条，则通过 AI（DeepSeek/GPT）基于热点话题自动生成补充至 8 条。
- **文章生成**：每天定时检查，若当日发布的文章不足 2 篇，则从预设的选题库（涵盖 Web3 基础、市场分析、全球经济等）中随机选取话题，自动生成 1-3 篇文章并直接发布。
- **SEO 动态 Sitemap**：`server/_core/index.ts` 中的 `/sitemap.xml` 路由已升级，会动态读取数据库中所有已发布的文章并生成对应的 URL 节点，确保 Google 等搜索引擎能及时抓取新内容。
**注意事项**：
- 该机制依赖 `DEEPSEEK_API_KEY` 或 `BUILT_IN_FORGE_API_KEY` 环境变量。
- 自动化任务通过 `setTimeout` 延迟 60 秒启动，以避免与服务器启动时的 RSS 抓取任务竞争数据库连接。
- 如果需要修改生成频率或数量，请直接调整 `dailyContent.ts` 中的 `TARGET_DAILY_NEWS` 和 `TARGET_DAILY_ARTICLES` 常量。
