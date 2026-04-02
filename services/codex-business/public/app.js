const STORAGE_KEYS = {
  codes: "teamxz_saved_codes_v1",
  warrantyHistory: "teamxz_warranty_history_v1"
};

const API_BASE = (() => {
  if (typeof window === "undefined") return "/api";
  const { pathname } = window.location;
  if (pathname.includes("/codex-business/app/")) {
    return "./api";
  }
  return "/api";
})();

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidCode(value) {
  return typeof value === "string" && value.trim().length >= 4;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

async function postJson(url, payload) {
  return requestJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

function getStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function setStoredJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function saveCode(code) {
  const cleaned = String(code || "").trim();
  if (!isValidCode(cleaned)) return;

  const current = getStoredJson(STORAGE_KEYS.codes, []);
  const next = [cleaned, ...current.filter((item) => item !== cleaned)].slice(0, 8);
  setStoredJson(STORAGE_KEYS.codes, next);
}

function recordWarrantyHistory(entry) {
  const current = getStoredJson(STORAGE_KEYS.warrantyHistory, []);
  const next = [entry, ...current].slice(0, 20);
  setStoredJson(STORAGE_KEYS.warrantyHistory, next);
}

function formatDateTime(value) {
  if (!value) return "";

  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  } catch (_error) {
    return String(value);
  }
}

function summarize(data, fallback) {
  return data.message || data.error || data.detail || data.content || data.title || fallback;
}

function getMaintenanceInfo(data) {
  if (!data || typeof data !== "object") return null;
  if (!data.title && !data.end_time && !String(data.detail || "").includes("维护")) return null;

  return {
    title: data.title || data.detail || "系统维护中",
    detail: data.content || data.detail || "系统正在维护，请稍后再试。",
    endTime: data.end_time || null
  };
}

function setPending(button, pendingText) {
  button.dataset.originalText = button.dataset.originalText || button.textContent;
  button.disabled = true;
  button.textContent = pendingText;
}

function clearPending(button) {
  button.disabled = false;
  button.textContent = button.dataset.originalText || button.textContent;
}

function renderMaintenance(target, maintenanceInfo) {
  if (!maintenanceInfo) {
    target.className = "maintenance hidden";
    target.innerHTML = "";
    return;
  }

  target.className = "maintenance";
  target.innerHTML = `
    <div class="maintenance-head">
      <div>
        <h3>${escapeHtml(maintenanceInfo.title)}</h3>
        <p>${escapeHtml(maintenanceInfo.detail)}</p>
      </div>
    </div>
    ${
      maintenanceInfo.endTime
        ? `<div class="maintenance-time">预计维护到：${escapeHtml(formatDateTime(maintenanceInfo.endTime))}</div>`
        : ""
    }
  `;
}

function buildRows(data) {
  const rows = [];
  const teamInfo = data.team_info || {};
  const warrantyInfo = data.warranty_info || {};

  if (teamInfo.team_name) rows.push(["团队", teamInfo.team_name]);
  if (teamInfo.subscription_plan) rows.push(["方案", teamInfo.subscription_plan]);
  if (teamInfo.expires_at) rows.push(["到期时间", formatDateTime(teamInfo.expires_at)]);
  if (warrantyInfo.remaining_days !== undefined) rows.push(["剩余天数", warrantyInfo.remaining_days]);
  if (warrantyInfo.used_by_email) rows.push(["使用邮箱", warrantyInfo.used_by_email]);
  if (data.end_time) rows.push(["维护结束", formatDateTime(data.end_time)]);
  if (data.count !== undefined) rows.push(["车位数量", data.count]);

  return rows.slice(0, 6);
}

function renderResult(target, ok, title, summary, data) {
  const rows = buildRows(data);
  const rowsHtml = rows.length
    ? `
      <dl class="result-grid">
        ${rows
          .map(
            ([label, value]) => `
              <div class="result-row">
                <dt>${escapeHtml(label)}</dt>
                <dd>${escapeHtml(value)}</dd>
              </div>
            `
          )
          .join("")}
      </dl>
    `
    : "";

  target.className = `result ${ok ? "success" : "error"}`;
  target.innerHTML = `
    <div class="result-head">
      <div>
        <h3 class="result-title">${escapeHtml(title)}</h3>
        <p class="result-summary">${escapeHtml(summary)}</p>
      </div>
      <span class="result-badge">${ok ? "已完成" : "未完成"}</span>
    </div>
    ${rowsHtml}
  `;
}

function renderGuide(target) {
  target.className = "guide";
  target.innerHTML = `
    <h3>手动质保流程</h3>
    <p>兑换完成后，请保留当前兑换码和邮箱，后续质保按下面流程操作。</p>
    <ol>
      <li>保留本页自动保存的兑换码，不要更换使用邮箱。</li>
      <li>需要确认状态时，在右侧“质保查询”输入原兑换码进行查询。</li>
      <li>如果需要重新上车，在右侧“质保重兑”填写原邮箱和原兑换码后提交。</li>
    </ol>
  `;
}

function renderSavedCodes() {
  const target = document.getElementById("saved-codes");
  const codes = getStoredJson(STORAGE_KEYS.codes, []);

  if (!codes.length) {
    target.className = "saved-codes hidden";
    target.innerHTML = "";
    return;
  }

  target.className = "saved-codes";
  target.innerHTML = `
    <h3>本地已保存兑换码</h3>
    <div class="saved-code-list">
      ${codes
        .map(
          (code) => `
            <button class="saved-chip" type="button" data-code="${escapeHtml(code)}">
              <code>${escapeHtml(code)}</code>
            </button>
          `
        )
        .join("")}
    </div>
  `;

  target.querySelectorAll("[data-code]").forEach((button) => {
    button.addEventListener("click", () => {
      const code = button.getAttribute("data-code") || "";
      const redeemCode = document.getElementById("redeem-code");
      const warrantyQueryCode = document.getElementById("warranty-query-code");
      const warrantyRedeemCode = document.getElementById("warranty-redeem-code");

      redeemCode.value = code;
      warrantyQueryCode.value = code;
      warrantyRedeemCode.value = code;
    });
  });
}

function renderWarrantyHistory() {
  const target = document.getElementById("warranty-history");
  const items = getStoredJson(STORAGE_KEYS.warrantyHistory, []);

  if (!items.length) {
    target.innerHTML = `<div class="history-empty">暂无质保记录</div>`;
    return;
  }

  target.innerHTML = items
    .map(
      (item) => `
        <article class="history-item ${item.ok ? "success" : "error"}">
          <div class="history-head">
            <div>
              <strong>${escapeHtml(item.type)}</strong>
              <p class="history-meta">${escapeHtml(item.summary)}</p>
            </div>
            <span class="history-status">${item.ok ? "成功" : "失败"}</span>
          </div>
          <p class="history-meta">时间：${escapeHtml(item.time)}</p>
          <p class="history-meta">兑换码：${escapeHtml(item.code)}</p>
          ${item.email ? `<p class="history-meta">邮箱：${escapeHtml(item.email)}</p>` : ""}
        </article>
      `
    )
    .join("");
}

async function loadHealth() {
  const pill = document.getElementById("health-pill");

  try {
    const result = await requestJson(`${API_BASE}/health`);
    pill.textContent = result.data.upstreamReachable ? "服务正常" : "服务异常";
  } catch (_error) {
    pill.textContent = "状态未知";
  }
}

async function loadFreeSpots() {
  const spotCount = document.getElementById("spot-count");
  const maintenance = document.getElementById("global-maintenance");

  try {
    const [pageMeta, result] = await Promise.all([
      requestJson(`${API_BASE}/page-meta`),
      requestJson(`${API_BASE}/free-spots`)
    ]);
    const maintenanceInfo = getMaintenanceInfo(result.data);

    if (maintenanceInfo) {
      renderMaintenance(maintenance, maintenanceInfo);
      spotCount.textContent = "--";
      return;
    }

    renderMaintenance(maintenance, null);
    const landingCount = pageMeta.data?.remaining_spots;
    spotCount.textContent = Number.isFinite(landingCount) ? landingCount : result.data.count ?? 0;
  } catch (_error) {
    spotCount.textContent = "--";
  }
}

function syncCodeIntoWarrantyInputs(code) {
  document.getElementById("warranty-query-code").value = code;
  document.getElementById("warranty-redeem-code").value = code;
}

function bindRedeemForm() {
  const form = document.getElementById("redeem-form");
  const resultBox = document.getElementById("redeem-result");
  const guideBox = document.getElementById("manual-warranty-guide");
  const maintenance = document.getElementById("global-maintenance");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    const email = document.getElementById("redeem-email").value.trim();
    const code = document.getElementById("redeem-code").value.trim();

    if (!isValidEmail(email)) {
      renderResult(resultBox, false, "输入有误", "请输入正确的邮箱地址。", {});
      return;
    }

    if (!isValidCode(code)) {
      renderResult(resultBox, false, "输入有误", "请输入有效的兑换码。", {});
      return;
    }

    setPending(button, "提交中...");

    try {
      const result = await postJson(`${API_BASE}/redeem/confirm`, { email, code, team_id: null });
      const maintenanceInfo = getMaintenanceInfo(result.data);
      saveCode(code);
      renderSavedCodes();
      syncCodeIntoWarrantyInputs(code);

      if (maintenanceInfo) {
        renderMaintenance(maintenance, maintenanceInfo);
        renderResult(resultBox, false, maintenanceInfo.title, maintenanceInfo.detail, result.data);
        return;
      }

      renderMaintenance(maintenance, null);
      renderResult(
        resultBox,
        result.ok,
        result.ok ? "兑换已提交" : "兑换失败",
        summarize(result.data, result.ok ? "请求已完成。" : "请求未成功，请稍后再试。"),
        result.data
      );

      if (result.ok) {
        renderGuide(guideBox);
      }

      await loadFreeSpots();
    } catch (error) {
      renderResult(resultBox, false, "请求失败", error.message || "发生未知错误", {});
    } finally {
      clearPending(button);
    }
  });
}

function bindWarrantyQueryForm() {
  const form = document.getElementById("warranty-query-form");
  const resultBox = document.getElementById("warranty-query-result");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    const code = document.getElementById("warranty-query-code").value.trim();

    if (!isValidCode(code)) {
      renderResult(resultBox, false, "输入有误", "请输入有效的兑换码。", {});
      return;
    }

    setPending(button, "查询中...");

    try {
      const result = await postJson(`${API_BASE}/warranty/query`, { code });
      saveCode(code);
      renderSavedCodes();

      const maintenanceInfo = getMaintenanceInfo(result.data);
      const title = maintenanceInfo ? maintenanceInfo.title : result.ok ? "质保状态已返回" : "质保查询失败";
      const summary = maintenanceInfo
        ? maintenanceInfo.detail
        : summarize(result.data, result.ok ? "查询已完成。" : "查询失败，请稍后再试。");

      renderResult(resultBox, result.ok && !maintenanceInfo, title, summary, result.data);

      recordWarrantyHistory({
        type: "质保查询",
        ok: result.ok && !maintenanceInfo,
        summary,
        code,
        time: formatDateTime(new Date().toISOString())
      });
      renderWarrantyHistory();
    } catch (error) {
      renderResult(resultBox, false, "请求失败", error.message || "发生未知错误", {});
      recordWarrantyHistory({
        type: "质保查询",
        ok: false,
        summary: error.message || "发生未知错误",
        code,
        time: formatDateTime(new Date().toISOString())
      });
      renderWarrantyHistory();
    } finally {
      clearPending(button);
    }
  });
}

function bindWarrantyRedeemForm() {
  const form = document.getElementById("warranty-redeem-form");
  const resultBox = document.getElementById("warranty-redeem-result");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    const email = document.getElementById("warranty-redeem-email").value.trim();
    const code = document.getElementById("warranty-redeem-code").value.trim();

    if (!isValidEmail(email)) {
      renderResult(resultBox, false, "输入有误", "请输入正确的邮箱地址。", {});
      return;
    }

    if (!isValidCode(code)) {
      renderResult(resultBox, false, "输入有误", "请输入有效的兑换码。", {});
      return;
    }

    setPending(button, "提交中...");

    try {
      const result = await postJson(`${API_BASE}/warranty/redeem`, { email, code });
      saveCode(code);
      renderSavedCodes();

      const maintenanceInfo = getMaintenanceInfo(result.data);
      const title = maintenanceInfo ? maintenanceInfo.title : result.ok ? "重兑请求已提交" : "重兑请求失败";
      const summary = maintenanceInfo
        ? maintenanceInfo.detail
        : summarize(result.data, result.ok ? "请求已完成。" : "请求未成功，请稍后再试。");

      renderResult(resultBox, result.ok && !maintenanceInfo, title, summary, result.data);

      recordWarrantyHistory({
        type: "质保重兑",
        ok: result.ok && !maintenanceInfo,
        summary,
        code,
        email,
        time: formatDateTime(new Date().toISOString())
      });
      renderWarrantyHistory();
    } catch (error) {
      renderResult(resultBox, false, "请求失败", error.message || "发生未知错误", {});
      recordWarrantyHistory({
        type: "质保重兑",
        ok: false,
        summary: error.message || "发生未知错误",
        code,
        email,
        time: formatDateTime(new Date().toISOString())
      });
      renderWarrantyHistory();
    } finally {
      clearPending(button);
    }
  });
}

function bindHistoryActions() {
  document.getElementById("clear-history").addEventListener("click", () => {
    setStoredJson(STORAGE_KEYS.warrantyHistory, []);
    renderWarrantyHistory();
  });
}

function bootstrapSavedCodes() {
  const codes = getStoredJson(STORAGE_KEYS.codes, []);
  if (!codes.length) return;

  const firstCode = codes[0];
  document.getElementById("redeem-code").value = firstCode;
  syncCodeIntoWarrantyInputs(firstCode);
}

if (typeof document !== "undefined") {
  bindRedeemForm();
  bindWarrantyQueryForm();
  bindWarrantyRedeemForm();
  bindHistoryActions();
  bootstrapSavedCodes();
  renderGuide(document.getElementById("manual-warranty-guide"));
  renderSavedCodes();
  renderWarrantyHistory();
  loadHealth();
  loadFreeSpots();
}
