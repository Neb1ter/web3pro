/**
 * IndexNow — 主动通知 Bing（及 Yandex）索引更新
 *
 * 协议说明：
 *   1. 在网站根目录托管 /{key}.txt，内容为 key 本身（已在 index.ts 注册路由）
 *   2. 向 https://api.indexnow.org/indexnow 发送 POST 请求，告知有哪些 URL 需要索引
 *   3. Bing 收到后会在数小时内完成爬取，Copilot/ChatGPT 的搜索结果也会随之更新
 *
 * 参考文档：https://www.indexnow.org/documentation
 */

// get8.pro 所有公开可索引的静态路由
const INDEXABLE_ROUTES = [
  "/",
  "/crypto-saving",
  "/exchanges",
  "/exchange-guide",
  "/exchange-download",
  "/beginner",
  "/crypto-intro",
  "/crypto-news",
  "/web3-guide",
  "/web3-guide/what-is-web3",
  "/web3-guide/blockchain-basics",
  "/web3-guide/wallet-keys",
  "/web3-guide/defi-deep",
  "/web3-guide/exchange-guide",
  "/web3-guide/investment-gateway",
  "/web3-guide/economic-opportunity",
  "/tools",
  "/contact",
  "/legal",
];

/**
 * 向 IndexNow API 提交 URL 列表
 * @param siteUrl  网站根 URL，例如 "https://get8.pro"
 * @param key      IndexNow API Key
 */
export async function submitIndexNow(siteUrl: string, key: string): Promise<void> {
  const host = new URL(siteUrl).hostname; // "get8.pro"
  const urlList = INDEXABLE_ROUTES.map(path => `${siteUrl}${path}`);

  const body = {
    host,
    key,
    keyLocation: `${siteUrl}/${key}.txt`,
    urlList,
  };

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });

    if (res.ok || res.status === 202) {
      console.log(`[IndexNow] ✅ Submitted ${urlList.length} URLs to Bing. Status: ${res.status}`);
    } else {
      const text = await res.text().catch(() => "");
      console.warn(`[IndexNow] ⚠️ Submission returned ${res.status}: ${text}`);
    }
  } catch (err) {
    // 网络失败不影响主服务，仅打印警告
    console.warn("[IndexNow] ⚠️ Failed to submit URLs:", err);
  }
}
