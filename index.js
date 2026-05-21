// ======================
// 梦晏晨 Ultimate Index
// index.js (完全防重复 + 稳定启动)
// ======================

if (!window.__meng_initialized) {
    window.__meng_initialized = true;

    console.log("[梦晏晨] Ultimate Index 启动中...");

    window.MengRuntime = window.MengRuntime || {};
    window.MengRuntime.indexLoaded = true;
    window.MengYanChen = window.MengYanChen || {};
    window.MengLogs = window.MengLogs || [];

    // ===== 工具函数 =====
    function mengLog(message, type = "log") {
        const time = new Date().toLocaleTimeString();
        const finalMsg = `🕒 [${time}] ${message}`;
        window.MengLogs.push(finalMsg);
        if (window.MengLogs.length > 1000) window.MengLogs.shift();
        console[type]("[梦晏晨]", message);
        try {
            const logBox = document.querySelector("#meng-live-log");
            if (logBox) {
                logBox.textContent += finalMsg + "\n";
                logBox.scrollTop = logBox.scrollHeight;
            }
        } catch (err) {}
    }

    function mengToast(msg) {
        try {
            if (window.toastr) toastr.success(msg);
            else console.log("[Toast]", msg);
        } catch (err) {}
        mengLog(msg);
    }

    function getSTContext() {
        try { return window.SillyTavern?.getContext?.(); } catch (err) { return null; }
    }

    // ===== 动态加载依赖（跳过已存在） =====
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const script = document.createElement("script");
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`加载失败: ${src}`));
            document.head.appendChild(script);
        });
    }

    async function loadDependencies() {
        const base = "scripts/extensions/third-party/meng-yan-chen/";
        const deps = [
            { name: "cleaner.js", check: () => window.MengCleaner?.cleanText },
            { name: "ui.js", check: () => window.MengUI?.openMengPanel && window.MengRuleManager }
        ];
        for (const { name, check } of deps) {
            if (check()) {
                mengLog(`✅ ${name} 已存在，跳过加载`);
                continue;
            }
            try {
                await loadScript(base + name);
                mengLog(`✅ 已加载 ${name}`);
            } catch (err) {
                mengLog(`💥 ${name} 加载失败: ${err.message}`, "error");
            }
        }
    }

    // ===== 安全等待 =====
    async function waitForCondition({ check, timeout = 15000, interval = 200, name = "Unknown" }) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            try { if (check()) { mengLog(`✅ ${name} 已就绪`); return true; } } catch (err) {}
            await new Promise(r => setTimeout(r, interval));
        }
        mengLog(`⚠️ ${name} 等待超时`);
        return false;
    }

    // ===== 设置定义 =====
    const PLUGIN_ID = "meng-yan-chen";
    const defaultSettings = {
        enabled: true,
        autoClean: true,
        autoLearning: true,
        protectVariables: true,
        protectWhitelist: true,
        protectStatusBar: true,
        showToast: true,
        showLogs: true,
        debug: false,
        maxTextLength: 500000,
        enableSentenceOptimization: true,
        actionWords: ["盯着","看着","笑着","沉默着","站着"],
        nameFixRules: [{ from: "林晟", to: "林晨", enabled: true }],
        simpleReplacements: [],
        regexRules: [],
        contextRules: [],
    };
    let settings = structuredClone(defaultSettings);

    // ===== 设置加载（优先 localStorage） =====
    async function loadSettings() {
        const local = localStorage.getItem("meng_rule_backup");
        if (local) {
            try {
                const parsed = JSON.parse(local);
                if (parsed && typeof parsed === "object") {
                    settings = Object.assign({}, defaultSettings, parsed);
                    mengLog("📂 已从本地存储读取设置");
                    return true;
                }
            } catch (e) { mengLog("⚠️ 本地存储数据损坏，忽略"); }
        }
        try {
            const ctx = getSTContext();
            if (ctx) {
                ctx.extension_settings = ctx.extension_settings || {};
                const saved = ctx.extension_settings[PLUGIN_ID];
                if (saved && typeof saved === "object") {
                    settings = Object.assign({}, defaultSettings, saved);
                    mengLog("📂 已从ST配置读取设置");
                    localStorage.setItem("meng_rule_backup", JSON.stringify(settings));
                    return true;
                }
            }
        } catch (e) { mengLog("⚠️ 读取ST配置失败"); }
        return false;
    }

    async function waitForSettingsLoad() {
        let loaded = await loadSettings();
        if (loaded) return;
        mengLog("⏳ 等待ST配置加载（最多5秒）...");
        await new Promise(resolve => {
            const timeout = setTimeout(() => {
                mengLog("⏰ 等待超时，使用默认设置");
                resolve();
            }, 5000);
            const check = () => {
                const ctx = getSTContext();
                if (ctx?.extension_settings?.[PLUGIN_ID]) {
                    clearTimeout(timeout);
                    resolve();
                } else {
                    setTimeout(check, 300);
                }
            };
            check();
        });
        await loadSettings();
        if (!settings || Object.keys(settings).length === 0) {
            settings = structuredClone(defaultSettings);
        }
    }

    // ===== 保存设置 =====
    async function saveSettings() {
        try {
            localStorage.setItem("meng_rule_backup", JSON.stringify(settings));
            mengLog("💾 设置已保存到本地存储");
            const ctx = getSTContext();
            if (ctx) {
                ctx.extension_settings = ctx.extension_settings || {};
                ctx.extension_settings[PLUGIN_ID] = structuredClone(settings);
                if (typeof ctx.saveSettingsDebounced === "function") {
                    ctx.saveSettingsDebounced();
                }
                mengLog("💾 设置已同步到ST配置");
            }
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    // ===== 模块等待 =====
    async function waitModulesReady() {
        mengLog("⏳ 等待核心模块...");
        await waitForCondition({ name: "MengCleaner", check: () => !!(window.MengCleaner?.cleanText) });
        await waitForCondition({ name: "MengUI", check: () => !!(window.MengUI?.openMengPanel) });
        await waitForCondition({ name: "RuleManager", check: () => !!window.MengRuleManager });
        mengLog("✅ 核心模块就绪");
    }

    // ===== 消息清洗 =====
    function isAlreadyCleaned(msg) { return msg?._meng_cleaned || window.MengYanChen?.messageCache?.has(msg); }
    function markCleaned(msg) { if (msg) { msg._meng_cleaned = true; try { window.MengYanChen?.messageCache?.add(msg); } catch {} } }
    function getMessageField(msg) { return typeof msg?.mes === "string" ? "mes" : typeof msg?.content === "string" ? "content" : null; }

    async function processMessage(msg, messageId) {
        if (!window.MengCleaner?.cleanText || !msg || isAlreadyCleaned(msg)) return;
        const field = getMessageField(msg);
        if (!field) return;
        const original = msg[field];
        if (typeof original !== "string") return;

        mengLog(`🧹 清洗消息 ${messageId}`);
        let cleaned = original;
        try { cleaned = await window.MengCleaner.cleanText(original, settings); } catch { return; }
        if (cleaned === original) { markCleaned(msg); return; }

        msg[field] = cleaned;
        markCleaned(msg);
        try {
            const chat = window.SillyTavern?.getContext?.()?.chat;
            if (chat?.[messageId]) { chat[messageId][field] = cleaned; chat[messageId]._meng_cleaned = true; }
        } catch {}
        try {
            const el = document.querySelector(`#chat .mes[mesid="${messageId}"] .mes_text`);
            if (el) el.textContent = cleaned;
        } catch {}
        mengLog(`✅ 消息 ${messageId} 清洗完成`);
    }

    function bindMessageEvents() {
        const ctx = window.SillyTavern?.getContext?.();
        if (!ctx || ctx._meng_bound || !ctx.eventSource) {
            setTimeout(bindMessageEvents, 1500);
            return;
        }
        ctx._meng_bound = true;
        const bind = (type, name) => ctx.eventSource.on(type, async (...args) => {
            try {
                if (type === ctx.event_types.CHAT_CHANGED) return;
                const id = Number(args?.[0]);
                if (isNaN(id)) return;
                const msg = ctx.chat?.[id];
                if (msg) { mengLog(`📨 ${name}: ${id}`); await processMessage(msg, id); }
            } catch (err) {}
        });
        bind(ctx.event_types.CHARACTER_MESSAGE_RENDERED, "角色消息");
        bind(ctx.event_types.USER_MESSAGE_RENDERED, "用户消息");
        bind(ctx.event_types.MESSAGE_SWIPED, "消息切换");
        bind(ctx.event_types.CHAT_CHANGED, "聊天切换");
        mengLog("🎧 消息监听绑定");
    }

    // ===== Panda 注入 =====
    async function injectPandaButton() {
        if (!settings || Object.keys(settings).length === 0) {
            setTimeout(injectPandaButton, 500);
            return;
        }
        if (window.MengUI?.injectPandaButton) {
            window.MengUI.injectPandaButton({
                settings,
                extension_settings: getSTContext()?.extension_settings,
                saveSettingsDebounced: saveSettings,
                PLUGIN_ID, mengLog, mengToast
            });
        } else setTimeout(injectPandaButton, 1000);
    }

    function createFloatingLogButton() {
        if ($("#meng-log-floating-btn").length) return;
        const btn = $(`<div id="meng-log-floating-btn" style="position:fixed;right:16px;bottom:125px;z-index:999999;background:rgba(170,255,200,0.12);border:1px solid rgba(170,255,200,0.18);backdrop-filter:blur(6px);padding:8px 12px;border-radius:14px;cursor:pointer;font-size:0.9rem;color:#d8ffe7;">😶‍🌫️ 日志</div>`);
        btn.on("click", () => { const b = $("#meng-live-log"); if (b.length) b.toggle(); else mengToast("无日志面板"); });
        $("body").append(btn);
    }

    // ===== 最终启动 =====
    (async () => {
        try {
            mengLog("🌿 开始执行 index.js");
            await loadDependencies();
            await waitModulesReady();
            await waitForSettingsLoad();

            window.MengYanChen.correctNames = window.MengYanChen.correctNames || new Set(["林晨", "谢知许", "洛君瑾"]);
            window.MengYanChen.pendingConfirmations = window.MengYanChen.pendingConfirmations || [];
            window.MengYanChen.messageCache = window.MengYanChen.messageCache || new WeakSet();
            mengLog("✅ 配置已就绪");

            if (window.MengRuleManager?.registerUpdateCallback) {
                window.MengRuleManager.registerUpdateCallback(async (ns) => {
                    if (ns) { settings = Object.assign({}, settings, structuredClone(ns)); await saveSettings(); }
                });
            }

            setInterval(() => {
                if (!$("#meng-panda-btn").length) injectPandaButton();
                if (!$("#meng-log-floating-btn").length) createFloatingLogButton();
            }, 10000);

            if (window.__ST_IMPORT_EXPORT_MODE__) {
                mengLog("⚠️ 导入模式，跳过启动");
                return;
            }

            if (document.readyState === "loading") await new Promise(r => document.addEventListener("DOMContentLoaded", r, { once: true }));
            injectPandaButton();
            createFloatingLogButton();
            bindMessageEvents();
            setInterval(() => saveSettings(), 30000);

            window.MengYanChenAPI = {
                settings, saveSettings, loadSettings: waitForSettingsLoad,
                injectPandaButton, processMessage, mengLog, mengToast
            };
            mengLog("🌟 全部模块运行完成");
        } catch (e) {
            console.error(e);
            mengLog("💥 启动崩溃");
        }
    })();
} else {
    console.warn("[梦晏晨] 插件已初始化，跳过重复执行");
}