# Strapi Headless CMS 搭建与集成指南 for get8.pro

**致**: get8.pro 网站负责人
**由**: Manus AI
**日期**: 2026年02月28日

---

## 1. 为什么选择 Strapi？

正如上次报告所述，Strapi 是最适合您当前需求的 Headless CMS。它能让您在**不修改任何前端代码**的情况下，通过一个友好的后台界面，轻松管理网站的所有内容（文章、教程、返佣链接、图片等）。

本指南将一步步教您如何为 `get8.pro` 搭建并集成 Strapi。

## 2. 准备工作

- **环境**: 您的开发环境或服务器需要安装 [Node.js](https://nodejs.org/) (v18 或更高版本) 和 `pnpm`。
- **项目结构**: 我们将在您的 `web3pro` 项目根目录下创建一个新的 `backend` 文件夹来存放 Strapi 项目，与现有的 `client` (前端) 和 `server` (旧后端) 文件夹并列。

```bash
/home/ubuntu/web3pro/
├── client/     # 您的 React 前端
├── server/     # 旧的 Express 后端
└── backend/    # (即将创建) Strapi 后台
```

## 3. 搭建流程 (5个步骤)

### 步骤 1：一键安装 Strapi

在 `web3pro` 根目录下，执行以下命令：

```bash
# --quickstart 会使用 SQLite 数据库，最适合快速启动
# my-project 是 Strapi 项目名，可自定义
pnpm create strapi-app@latest backend --quickstart
```

安装过程大约需要2-3分钟。完成后，Strapi 会自动在 `http://localhost:1337/admin` 启动。

### 步骤 2：创建您的第一个管理员账户

首次访问 `http://localhost:1337/admin`，您会看到一个注册页面。请创建您的管理员账户，这是您未来登录后台的唯一凭证。

![Strapi Admin Registration](https://i.imgur.com/strapi-admin.png)  <-- (这是一个示例图片链接)

### 步骤 3：定义内容模型 (Content-Type Builder)

这是最核心的一步。我们需要告诉 Strapi，我们的网站有哪些类型的内容需要管理。

1.  登录后台后，在左侧导航栏找到 **Content-Type Builder**。
2.  点击 **+ Create new collection type**。

让我们以“**Web3教程 (Web3 Tutorial)**”为例：

-   **Display name**: `Web3 Tutorial` (Strapi 会自动生成 API ID: `web3-tutorial`)
-   点击 **Continue**。

现在，为这个内容类型添加字段 (Fields)：

| 字段类型 | 字段名 (Name) | 描述 |
| :--- | :--- | :--- |
| **Text** | `title` | 教程标题 (例如: "什么是区块链？") |
| **Text** | `slug` | URL路径 (例如: "what-is-blockchain") |
| **Rich Text** | `content` | 教程正文 (支持 Markdown) |
| **Media** | `coverImage` | 封面图 (单张图片) |
| **Text** | `author` | 作者名 |
| **Date** | `publishedDate` | 发布日期 |
| **Enumeration** | `category` | 分类 (例如: 基础, DeFi, NFT) |

重复此过程，为您网站的其他板块创建内容模型，例如：
-   **交易所评测 (Exchange Review)**: 包含交易所名称、Logo、评分、优点、缺点、返佣链接等字段。
-   **新闻文章 (News Article)**: 包含标题、来源、发布时间、正文等字段。

### 步骤 4：开放 API 访问权限

默认情况下，所有 API 都是锁定的。我们需要公开“读取”权限，让您的 React 前端可以获取数据。

1.  在左侧导航栏找到 **Settings** -> **Roles** -> **Public**。
2.  在 **Permissions** 标签下，找到您刚刚创建的内容类型 (例如 `Web3-tutorial`)。
3.  勾选 `find` 和 `findOne` 两个操作的复选框。
    -   `find`: 允许获取所有教程列表 (例如，用于教程首页)。
    -   `findOne`: 允许通过 ID 或 slug 获取单个教程详情。
4.  点击右上角的 **Save**。

### 步骤 5：在 React 前端获取并展示数据

现在，您的 Strapi 后台已经可以通过 API 提供数据了。API 地址是：

-   获取列表: `http://localhost:1337/api/web3-tutorials`
-   获取单篇: `http://localhost:1337/api/web3-tutorials/1` (按ID)

修改您的 React 页面 (例如 `/pages/Web3Guide.tsx`)，将写死的内容替换为从 API 获取的动态内容。

**示例代码：**

```tsx
import { useState, useEffect } from 'react';

// 假设这是您的教程卡片组件
function TutorialCard({ title, author }) {
  return (
    <div className="tutorial-card">
      <h3>{title}</h3>
      <p>By {author}</p>
    </div>
  );
}

function Web3GuidePage() {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从 Strapi API 获取数据
    fetch('http://localhost:1337/api/web3-tutorials')
      .then(res => res.json())
      .then(data => {
        setTutorials(data.data); // Strapi 的数据在 .data 属性里
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching data from Strapi:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading tutorials...</p>;

  return (
    <div className="web3-guide-page">
      <h1>Web3 入圈指南</h1>
      <div className="tutorials-grid">
        {tutorials.map(tutorial => (
          <TutorialCard 
            key={tutorial.id} 
            title={tutorial.attributes.title} 
            author={tutorial.attributes.author} 
          />
        ))}
      </div>
    </div>
  );
}

export default Web3GuidePage;
```

## 4. 部署上线

-   **前端**: 您的前端应用保持不变，继续通过 Vercel/Render 等平台进行静态部署。
-   **后台**: 您可以将 Strapi 后台部署到 [Render](https://render.com/)、[Railway](https://railway.app/) 或任何支持 Node.js 的服务器上。Render 提供了专门的 Strapi 部署模板，非常方便。

完成以上步骤后，您就拥有了一个真正实现**前后端分离**的现代化网站。从此，运营人员可以随时登录 `admin.get8.pro` (您的后台域名) 更新内容，而无需再麻烦开发人员。
