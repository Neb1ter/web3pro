---
name: broker-page-design
description: 代理商/经纪商/节点计划页面设计规范。当用户要求设计「代理商页面」「经纪商计划页面」「节点计划页面」「返佣推广页面」时使用此技能，参考 OKX 经纪商页面风格，使用黑底黄绿配色、几何动画、滚动触发动画、pill 形按钮等设计规范。
---

# 代理商页面设计技能

## 核心风格

参考 OKX 经纪商页面（`/zh-hans/broker`），「黑底黄绿」极简科技风。

## 配色规范

| 用途 | 值 |
|------|-----|
| 主背景 | `#000000` / `#0a0a0a` |
| 卡片背景 | `#0d0d0d` / `#111111` |
| 对比区块（白色板块） | `#ffffff` |
| 主色（按钮/图标/高亮） | `#C9F231` |
| 主色 hover | `#d4f54a` |
| 辅助灰色文字 | `#888888` |
| 卡片边框 | `rgba(255,255,255,0.05)` |
| 卡片 hover 边框 | `rgba(201,242,49,0.20)` |

黑色与白色板块**交替出现**，形成明暗对比节奏。主色 `#C9F231` 仅用于按钮、图标、数字高亮，不大面积铺底。

## 按钮规范

所有按钮统一使用 **pill 形**（`rounded-full`）：
- 主 CTA：`bg-[#C9F231] text-black font-bold`，hover 时 `scale(1.02)` + 阴影 `shadow-[#C9F231]/40`
- 次要：透明背景 + `border border-white/25`，hover 边框加深

## 图标规范

SVG 线条风格，颜色 `#C9F231`，`strokeWidth="1.5"`，40×40px。X 形元素贯穿品牌语言。卡片 hover 时图标 `scale(1.1)`。

## 标准板块顺序

```
1. 固定顶部导航（毛玻璃，滚动后激活）
2. Hero 全屏（旋转 X 几何 + 网格背景 + 大标题 + 双 CTA）
3. 数据统计横条（CountUp 数字递增动画）
4. 代理商类型（白色背景，双列卡片）
5. 核心优势（黑色背景，5列 SVG 图标卡片）
6. 合作伙伴（白色背景，2×2 详情卡片）
7. 最新动态（深黑背景，3列卡片含插图区）
8. FAQ（白色背景，折叠式，+号旋转 45°）
9. 申请表单（黑色背景，居中单列）
10. Footer
```

## 动画规范

### Hero 背景

```css
/* 旋转 X 形（20s linear infinite） */
@keyframes spin-slow {
  from { transform: translate(-50%,-50%) rotate(0deg); }
  to   { transform: translate(-50%,-50%) rotate(360deg); }
}
/* 浮动光晕（6s/8s ease-in-out infinite） */
@keyframes float {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-20px); }
}
```

叠加 60px 间距网格线（`stroke: rgba(255,255,255,0.03)`）和两个径向渐变光晕。

### 滚动触发（FadeUp 组件）

使用 `IntersectionObserver`，进入视口时：`opacity 0→1`，`translateY(32px)→0`，`transition: 0.7s ease`。多列卡片 delay 错开 80-120ms。

### CountUp 数字递增

进入视口后从 0 递增到目标值，1800ms，`setInterval` 每 16ms 更新。

### 导航栏毛玻璃

```javascript
// 滚动 > 60px 激活
background: rgba(0,0,0,0.9);
backdrop-filter: blur(12px);
border-bottom: 1px solid rgba(255,255,255,0.08);
```

## 申请表单规范

- 居中单列，`max-w-lg`
- 输入框：`bg-[#0d0d0d] border border-white/10`，focus 时 `border-[#C9F231]/40`
- 必填：姓名、邮箱、身份类型（下拉）；选填：Telegram
- 提交成功：替换为带绿色勾选图标的成功卡片

## 参考资源

详细设计规范见 `references/design_guide.md`。
