# 去除“AI 味”写作 Skills（GitHub 素材整理版）

> 目标：让 AI 生成内容更像“真人写作/编辑过”的文本（更清晰、更具体、更有节奏），**优先提升写作质量**，不以“绕过检测”作为目标。  
> 更新时间：2026-03-03

---

## 1. 推荐优先级（从最值得落地到补充项）

### A. 最推荐：工程化写作质量工具链（可接入 CI / 团队统一标准）

#### 1) Vale（写作 Linter 引擎）— 首选
- GitHub：https://github.com/errata-ai/vale
- 价值：把“AI 味”常见问题（空话、冗长、被动语态、弱动词、模板化表达）变成可自动检查的规则；适合 Markdown/文档/博客/产品文案。
- 用法建议：选择一个规则集（见下方）+ 叠加你自己公司的术语/语气/标题规范。

**常用 Vale 规则集（直接套用）**
- Elastic Docs 规则：https://github.com/elastic/vale-rules
- DataDog Docs 规则：https://github.com/DataDog/datadog-vale
- Splunk Style Guide 规则：https://github.com/splunk/vale-splunk-style-guide

---

#### 2) textlint（可扩展自然语言 Linter）
- GitHub：https://github.com/textlint/textlint
- 价值：生态很大，适合按语言/场景安装规则包（中/日/英均可用）；同样适合工程化接入。

---

#### 3) retext（unified 生态的自然语言处理管线）
- GitHub：https://github.com/retextjs/retext
- 价值：更偏开发者，可把“检查/修复/统计”做成可组合插件管线，适合自定义程度很高的团队。

**可读性插件**
- retext-readability：https://github.com/retextjs/retext-readability

---

### B. 英文写作增强（快速消灭“AI 腔”的经典问题）

#### 4) write-good（轻量英文文风检查）
- GitHub：https://github.com/btford/write-good
- 价值：快速抓“弱表达、冗长句、被动语态、空洞修饰”等典型 AI 痕迹；上手快。

#### 5) proselint（更全面的英文行文风格检查）
- GitHub：https://github.com/amperser/proselint
- 价值：更偏“编辑视角”的写作问题（陈词滥调、用词不当、风格缺陷等）。

---

### C. 风格与措辞（让文本更“有人味”的辅助项）

#### 6) alex（包容性/友好表达检查）
- GitHub：https://github.com/get-alex/alex
- 价值：减少不友好或刻板表达，让文本更像真实编辑过的公共写作。

#### 7) Plain Language 指南（反“AI 味”的底层原则：清晰、具体、短句）
- GitHub：https://github.com/GSA/plainlanguage.gov
- 价值：把“解释型 AI 味”的长句拆短、少抽象名词堆叠、用直接动词和结构化表达。

---

## 2. 不建议优先：Humanize / Undetectable 类仓库（谨慎）
你可能会搜到大量 “humanize ai text / remove ai patterns / undetectable” 相关 repo（例如：`Houcem0/Free-HumanizerAI-Assistant`、`ophielel/humanize-ai-text` 等）。  
这类项目常见问题：
- 目标更偏“伪装/绕过检测”，而不是稳定提升写作质量
- 质量差异大、可控性弱、合规风险更高

如果你的目标是“更自然、更清晰、更像真人写作”，建议优先用 **Vale/textlint + 下面的重写 skills**。

---

## 3. 可直接复用的写作 Skills（Prompt 模板）

> 使用方式：先让 AI 产出初稿 → 再用以下 skills 改写两轮 → 最后用 Vale/proselint/write-good 做 lint 校对。

### Skill 1：Plain-language 重写（降模板感、降抽象）
**Prompt**
你是资深编辑。把下面文字改写成“清晰、具体、口语但专业”的风格：  
- 句子尽量短（平均 12–18 词/中文 20–30 字）  
- 用主动语态、具体动词，减少“进行/实现/赋能/促进/进一步”等虚词  
- 删除空话套话与重复信息  
- 每段只表达一个要点  
输出：改写稿 + 你做了哪些改动（要点列表）  
文本：<<<...>>>

---

### Skill 2：信息落地化（加真实细节，让它像“从业者写的”）
**Prompt**
把下面内容改写得更像真实从业者写的，但不要编造不可验证事实。你可以做：  
- 把泛泛的结论改成“条件 + 结果 + 例子/数字范围/边界”  
- 给出 1–2 个具体场景例子（如果原文没给，就用“可替换占位符”）  
- 给出反例/注意事项（1 条即可）  
输出改写稿，并在文末列出：哪些细节需要我确认（用 [待确认] 标注）。  
文本：<<<...>>>

---

### Skill 3：句式节奏变化（消除“均匀 AI 腔”）
**Prompt**
保持原意，重写时刻意制造“人写的节奏”：  
- 长短句交替（每段至少 1 句短句）  
- 允许少量不完全句/转折句（但保持专业）  
- 每段首句更像观点/结论，后面用解释或例子支撑  
输出：改写稿 + 一段节奏说明（你如何调整长短句）。  
文本：<<<...>>>

---

### Skill 4：去“免责声明式”口吻（更直接、有条件）
**Prompt**
找出并删除/改写以下类型句子：  
- 过度中立： “在某些情况下”“可能会”“通常来说”但没有条件  
- 过度总结： “综上所述”“总的来说”但没有新增信息  
- 过度分点：每句话都像模板列表  
改写目标：更直接、更像作者有立场，但不夸大。  
文本：<<<...>>>

---

### Skill 5：最终人工检查清单（每次交付前过一遍）
- 是否大量使用抽象名词堆叠（优化/赋能/趋势/维度/生态/体系…）？
- 是否每段都有：一个明确观点 + 支撑细节（例子/条件/边界）？
- 是否至少出现 1 个具体场景或例子（没有就用占位符并标注 [待确认]）？
- 是否每段至少 1 句短句（起到“像人写的停顿/强调”作用）？
- 是否删掉所有不产生新信息的套话总结？

---

## 4. 推荐落地组合（最省事、效果稳定）

### 组合 A（团队/项目最佳实践）
1) AI 初稿  
2) 用 **Skill 1 + Skill 2** 重写两轮（先清晰、再落地）  
3) 用 **Vale（+规则集）** 统一风格与禁用表达  
4) 可选：用 **retext-readability** 校验可读性

### 组合 B（英文短平快）
1) AI 初稿  
2) 用 **Skill 3** 调节节奏  
3) 用 **write-good + proselint** 扫一遍  
4) 进行人工精修（补例子、删套话）

---

## 5. 快速索引（按用途）
- 统一风格/可接入 CI：Vale、textlint
- 可读性/自然语言处理管线：retext、retext-readability
- 英文文风快速修正：write-good、proselint
- 更友好措辞：alex
- 清晰表达方法论：plainlanguage.gov
