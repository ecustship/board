import React, { useState } from "react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";

const text = {
  en: {
    title: "Marine Dashboard",
    subtitle: "Sign in with the backend account to receive a JWT access token.",
    username: "Username",
    password: "Password",
    usernamePlaceholder: "admin",
    passwordPlaceholder: "admin123",
    signIn: "Sign In",
    signingIn: "Signing In",
    backend: "Backend API",
    demoAccount: "Default accounts: admin, operator, viewer",
    required: "Username and password are required.",
    failed: "Login failed. Check the account or backend service.",
  },
  zh: {
    title: "船机监控平台",
    subtitle: "使用后端账号登录，获取 JWT Token 后进入系统。",
    username: "用户名",
    password: "密码",
    usernamePlaceholder: "admin",
    passwordPlaceholder: "admin123",
    signIn: "登录",
    signingIn: "登录中",
    backend: "后端接口",
    demoAccount: "默认账号：admin、operator、viewer",
    required: "请输入用户名和密码。",
    failed: "登录失败，请检查账号或后端服务。",
  },
};

const LoginPage = () => {
  const { language } = useLanguage();
  const { login, status } = useAuth();
  const copy = text[language === "zh" ? "zh" : "en"];
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const isLoading = status === "authenticating";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError(copy.required);
      return;
    }

    try {
      await login({ username: username.trim(), password });
    } catch (loginError) {
      setError(loginError?.payload?.message || loginError?.message || copy.failed);
    }
  };

  return (
    <main className="flex h-[100dvh] items-start justify-center overflow-y-auto bg-[#edf2f4] px-4 py-8 text-[#1A1B1F] dark:bg-background dark:text-on-background md:items-center">
      <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_0.7px,transparent_0.7px)] [background-size:22px_22px] opacity-40" />
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-surface-container-lowest md:grid-cols-[1.05fr_0.95fr]"
      >
        <div className="flex min-h-[520px] flex-col justify-between bg-[#121417] p-8 text-white">
          <div>
            <span className="inline-flex rounded bg-white px-2 py-1">
              <img src="/image/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
            </span>
          </div>

          <div className="max-w-md">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#4CD7D0]/35 bg-[#4CD7D0]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#4CD7D0]">
              <span className="h-2 w-2 rounded-full bg-[#4CD7D0]" />
              JWT Access
            </div>
            <h1 className="text-4xl font-black uppercase tracking-wide sm:text-5xl">{copy.title}</h1>
            <p className="mt-4 text-sm leading-6 text-white/68">{copy.subtitle}</p>
          </div>

          <div className="grid gap-3 text-xs text-white/60 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-white/35">{copy.backend}</div>
              <div className="truncate font-mono text-[#4CD7D0]">{API_BASE_URL}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-white/35">Token</div>
              <div className="font-mono text-[#4CD7D0]">Authorization: Bearer</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-[520px] flex-col justify-center p-8 sm:p-10">
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#0058bc] dark:text-[#4CD7D0]">
              Authentication
            </p>
            <h2 className="mt-2 text-2xl font-black">{language === "zh" ? "后端账号登录" : "Backend Login"}</h2>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-on-surface-variant">
                {copy.username}
              </span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-[#4CD7D0] focus:bg-white dark:border-white/10 dark:bg-surface-container-low dark:focus:bg-surface-container"
                placeholder={copy.usernamePlaceholder}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-on-surface-variant">
                {copy.password}
              </span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-[#4CD7D0] focus:bg-white dark:border-white/10 dark:bg-surface-container-low dark:focus:bg-surface-container"
                placeholder={copy.passwordPlaceholder}
              />
            </label>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 h-12 rounded-xl bg-[#1A1B1F] text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#0058bc] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#4CD7D0] dark:text-[#00201e]"
          >
            {isLoading ? copy.signingIn : copy.signIn}
          </button>

          <p className="mt-4 text-center text-[11px] font-bold text-slate-400">{copy.demoAccount}</p>
        </form>
      </motion.section>
    </main>
  );
};

export default LoginPage;
