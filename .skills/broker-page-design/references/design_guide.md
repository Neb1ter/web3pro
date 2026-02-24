# 代理商页面设计风格规范

> 本文档记录了参考 Gate、OKX、Bybit 三大交易所代理/节点计划页面后提炼的设计规范，适用于所有代理商、经纪商、节点计划类页面的设计与开发。

---

## 一、整体视觉风格

本风格以 **OKX 经纪商页面**为主要参考，核心特征为「黑底黄绿」极简科技风。

| 属性 | 规范值 |
|------|--------|
| 主背景色 | `#000000` / `#0a0a0a` |
| 卡片背景色 | `#0d0d0d` / `#111111` |
| 对比区块（白色板块） | `#ffffff` |
| 主色（高亮/按钮/图标） | `#C9F231`（黄绿色） |
| 主色 hover 状态 | `#d4f54a` |
| 正文白色 | `#ffffff` |
| 辅助灰色文字 | `#888888` / `#555555` |
| 分割线 | `rgba(255,255,255,0.08)` |
| 卡片边框 | `rgba(255,255,255,0.05)` |
| 卡片 hover 边框 | `rgba(201,242,49,0.20)` |

---

## 二、配色使用原则

黑色与白色板块交替出现，形成强烈的明暗对比节奏：Hero（黑）→ 数据统计（深黑）→ 经纪商类型（白）→ 核心优势（黑）→ 合作伙伴（白）→ 最新动态（深黑）→ FAQ（白）→ 申请表单（黑）。

主色 `#C9F231` 仅用于：填充按钮、图标线条、数字高亮、链接文字、hover 边框、小圆点指示器。不可大面积铺底使用。

---

## 三、按钮规范

所有按钮统一使用 **pill 形（圆形胶囊）**，即 `border-radius: 9999px`（Tailwind: `rounded-full`）。

| 类型 | 样式 |
|------|------|
| 主要按钮（CTA） | 背景 `#C9F231`，文字黑色，`font-bold`，hover 背景 `#d4f54a` + `scale(1.02)` |
| 次要按钮（描边） | 透明背景，边框 `rgba(255,255,255,0.25)`，白色文字，hover 边框加深 + 轻微白色背景 |
| 白色板块内按钮 | 主按钮同上；次要按钮边框 `#e5e7eb`，灰色文字 |

---

## 四、图标规范

使用 **SVG 线条风格图标**，不使用 Emoji 或实心图标。

- 线条颜色：`#C9F231`
- 线条粗细：`strokeWidth="1.5"`
- 图标尺寸：40×40px（优势卡片内）、16×16px（导航/按钮内）
- 图标风格：几何线条，X 形元素（参考 OKX 品牌语言）贯穿全页
- 卡片 hover 时图标执行 `scale(1.1)` 放大动画

---

## 五、页面板块结构（标准顺序）

```
1. 固定顶部导航栏（毛玻璃效果）
2. Hero 全屏区（旋转几何背景 + 大标题 + 双 CTA）
3. 数据统计横条（数字递增动画）
4. 经纪商/代理商类型（白色背景，双列卡片）
5. 核心优势（黑色背景，5列 SVG 图标卡片）
6. 合作伙伴（白色背景，2×2 详情卡片）
7. 最新动态/产品更新（深黑背景，3列卡片含插图）
8. 常见问题 FAQ（白色背景，折叠式）
9. 申请表单（黑色背景，居中单列）
10. 底部 Footer
```

---

## 六、动画规范

### 6.1 Hero 背景动画

```css
/* 旋转 X 形几何体 */
@keyframes spin-slow {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}
/* 动画时长：20s linear infinite */

/* 浮动光晕 */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-20px); }
}
/* 动画时长：6s / 8s ease-in-out infinite */
```

Hero 区还需叠加：
- 60px 间距的网格线（`stroke: rgba(255,255,255,0.03)`）
- 两个径向渐变光晕（`rgba(201,242,49,0.06)` 和 `rgba(201,242,49,0.04)`）

### 6.2 滚动进入动画（Intersection Observer）

所有板块内容使用 `FadeUp` 组件包裹，进入视口时触发：

```
opacity: 0 → 1
transform: translateY(32px) → translateY(0)
transition: 0.7s ease
```

多列卡片使用 `delay` 错开（每列间隔 80-120ms），形成瀑布式入场效果。

### 6.3 数字递增动画（CountUp）

数据统计区的数字在进入视口时从 0 递增到目标值，持续时长 1800ms，使用 `setInterval` 每 16ms 更新一次。

### 6.4 卡片交互动画

```css
/* hover 上浮 */
transform: translateY(-4px);
transition: all 0.3s;

/* hover 边框高亮 */
border-color: rgba(201,242,49,0.20);
```

### 6.5 导航栏滚动效果

```javascript
// 滚动超过 60px 后激活毛玻璃效果
background: rgba(0,0,0,0.9);
backdrop-filter: blur(12px);
border-bottom: 1px solid rgba(255,255,255,0.08);
```

### 6.6 其他动画

```css
/* 向下滚动提示弹跳 */
@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%       { transform: translateX(-50%) translateY(8px); }
}

/* Hero 徽章脉冲点 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

/* Hero 内容淡入上移 */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## 七、导航栏规范

- 固定顶部（`position: fixed`），`z-index: 50`
- 左侧：X 形 SVG LOGO（`#C9F231`）+ 页面标题
- 中间：锚点导航链接（灰色，hover 白色）
- 右侧：主 CTA 按钮（pill 形，`#C9F231`）
- 初始状态：透明背景
- 滚动后：毛玻璃背景 + 底部边框

---

## 八、申请表单规范

- 居中单列，最大宽度 `max-w-lg`
- 输入框：深黑背景（`#0d0d0d`），细边框（`rgba(255,255,255,0.10)`），focus 时边框变 `rgba(201,242,49,0.40)`
- 必填字段：姓名、邮箱、身份类型（下拉选择）
- 选填字段：Telegram 账号
- 提交按钮：全宽 pill 形，`#C9F231` 背景
- 提交成功：显示带绿色勾选图标的成功卡片，替换表单

---

## 九、FAQ 规范

- 白色背景，`divide-y` 分割线
- 每条问题：左侧问题文字 + 右侧 `+` 号（展开时旋转 45°）
- 展开动画：`max-height: 0 → 200px`，`opacity: 0 → 1`，`transition: 0.3s`
- 不使用卡片包裹，极简分割线风格

---

## 十、参考来源

| 交易所 | 页面名称 | 参考要素 |
|--------|----------|----------|
| OKX | 经纪商计划 (`/zh-hans/broker`) | 整体风格、动画、配色、板块结构、图标风格 |
| Gate.io | 代理计划 (`/zh/broker`) | 返佣数据、经纪商类型分类 |
| Bybit | 代理商计划 (`/zh-CN/broker`) | 安全保障模块、FAQ 内容 |

---

*文档创建于 2026-02-25，由 Manus 自动生成并维护。*
