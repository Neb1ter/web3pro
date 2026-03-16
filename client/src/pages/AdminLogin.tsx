import { useState } from "react";
import { useLocation } from "wouter";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("请输入管理员密码");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const payload = await response.json();
      if (response.ok && payload.success) {
        navigate("/admin/exchange-guide");
        return;
      }

      setError(payload.error || "登录失败，请检查密码");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0A192F" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 shadow-2xl"
        style={{ background: "#112240", border: "1px solid #1E3A5F" }}
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">Admin</div>
          <h1 className="text-2xl font-bold text-white">管理员登录</h1>
          <p className="text-slate-400 text-sm mt-2">Get8 Pro 后台管理系统</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              管理员密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入管理员密码"
              autoFocus
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-lg text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 transition"
              style={{ background: "#0A192F", border: "1px solid #1E3A5F" }}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 rounded-lg px-4 py-2 border border-red-800/40">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: loading ? "#1E3A5F" : "#2563EB" }}
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-6">
          仅限授权管理员访问
        </p>
      </div>
    </div>
  );
}
