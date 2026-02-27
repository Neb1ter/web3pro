# Get8 Pro 后台管理操作手册

> 适用人群：不懂代码的内容运营人员
> 后台地址：运行后访问 `http://你的服务器IP:1337/admin`

---

## 一、登录后台

1. 打开浏览器，访问后台地址
2. 输入管理员账号和密码
3. 点击 **Login** 进入管理界面

---

## 二、后台界面说明

登录后，左侧菜单主要有以下几个区域：

| 菜单项 | 用途 |
|---|---|
| **Content Manager** | 管理所有内容（教程、交易所评测、返佣链接） |
| **Media Library** | 上传和管理图片 |
| **Content-Type Builder** | 修改内容字段（一般不需要动） |
| **Settings** | 系统设置（权限、用户管理等） |

---

## 三、如何新增一篇 Web3 教程

1. 点击左侧 **Content Manager**
2. 点击 **Web3 Tutorial**
3. 点击右上角蓝色按钮 **+ Create new entry**
4. 填写以下字段：

| 字段 | 说明 | 示例 |
|---|---|---|
| **title** | 文章标题（必填） | 什么是NFT？ |
| **slug** | 网址路径，自动生成，也可手动改 | what-is-nft |
| **summary** | 文章摘要，显示在列表页（最多500字） | 了解NFT的基本概念... |
| **content** | 正文内容，支持富文本编辑 | （正文内容） |
| **cover_image** | 封面图片，点击上传 | — |
| **category** | 分类，下拉选择 | beginner（入门） |
| **tags** | 标签，用逗号分隔 | nft, web3 |
| **read_time** | 预计阅读时间（分钟） | 8 |
| **is_featured** | 是否设为精选（首页展示） | True |

5. 填写完成后，点击右侧 **Publish** 按钮发布
   - 点击 **Save** 只是保存草稿，不会在网站显示
   - 点击 **Publish** 才会在网站上公开显示

---

## 四、如何新增/修改交易所评测

1. 点击左侧 **Content Manager** → **Exchange Review**
2. 点击已有条目可以编辑，点击 **+ Create new entry** 新增

| 字段 | 说明 |
|---|---|
| **name** | 交易所中文名（如：币安） |
| **name_en** | 交易所英文名（如：Binance） |
| **logo** | 交易所 Logo 图片 |
| **rating** | 综合评分（0-5分，如：4.8） |
| **pros** | 优点（每行一条） |
| **cons** | 缺点（每行一条） |
| **description** | 详细介绍正文 |
| **rebate_rate** | 返佣比例说明（如：最高20%手续费返佣） |
| **rebate_link** | 专属返佣注册链接 |
| **official_website** | 官网地址 |
| **trading_fee** | 手续费说明 |
| **is_recommended** | 是否推荐（首页重点展示） |
| **sort_order** | 排序，数字越小越靠前 |

---

## 五、如何管理返佣链接

1. 点击左侧 **Content Manager** → **Rebate Link**
2. 每条返佣链接包含以下字段：

| 字段 | 说明 |
|---|---|
| **exchange_name** | 交易所名称（中英文） |
| **link_type** | 链接类型（注册返佣/交易返佣/API返佣） |
| **rebate_url** | 专属返佣链接地址 |
| **rebate_percentage** | 返佣比例（如：20%） |
| **description** | 链接描述，用于前端展示 |
| **is_active** | 是否启用（True=启用，False=停用） |
| **expires_at** | 过期时间（可选，到期自动失效） |
| **sort_order** | 排序 |

---

## 六、如何上传图片

1. 点击左侧 **Media Library**
2. 点击 **+ Add new assets** 上传图片
3. 支持拖拽上传，支持 JPG、PNG、WebP、GIF 格式
4. 上传后在编辑内容时，点击图片字段即可选择已上传的图片

---

## 七、内容发布流程

```
新建内容 → 填写字段 → 保存草稿(Save) → 预览检查 → 发布(Publish) → 网站显示
```

- **草稿状态**：只有管理员能看到，网站访客看不到
- **已发布状态**：网站访客可以正常访问
- **取消发布**：点击 **Unpublish** 可以将已发布内容退回草稿

---

## 八、常见问题

**Q：修改了内容但网站没有更新？**
A：确认点击的是 **Publish** 而不是 **Save**。如果是已发布的内容修改后，需要再次点击 **Publish** 才能更新。

**Q：如何修改已发布的内容？**
A：直接点击内容进入编辑，修改后点击 **Publish** 即可覆盖更新。

**Q：如何删除内容？**
A：进入内容编辑页，点击右上角 **...** 菜单，选择 **Delete this document**。

**Q：忘记密码怎么办？**
A：在登录页点击 **Forgot your password?**，输入管理员邮箱，系统会发送重置链接。

---

## 九、后台部署到服务器（技术人员操作）

当您需要将后台部署到服务器时，执行以下步骤：

```bash
# 1. 进入后台目录
cd web3pro/backend

# 2. 安装依赖
pnpm install

# 3. 配置环境变量（复制示例文件并填写）
cp .env.example .env
# 编辑 .env 文件，填写 APP_KEYS、JWT_SECRET 等密钥

# 4. 构建管理面板
pnpm build

# 5. 启动服务（生产环境）
NODE_ENV=production pnpm start

# 后台将运行在 http://服务器IP:1337/admin
```

**推荐部署平台**：Railway、Render、DigitalOcean（均支持一键部署 Node.js 应用）

---

*本手册由 Get8 Pro 技术团队提供，如有问题请联系技术支持。*
