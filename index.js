// ======================
// 梦晏晨 Ultimate Index
// index.js (最终版，不再动态加载)
// ======================

console.log("[梦晏晨] Ultimate Index 启动中...");

// 防重复加载
if (window.MengRuntime?.indexLoaded) {
    console.warn("[梦晏晨] Index 已加载，阻止重复初始化");
}
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

function mengToast(message) {
    try {
        if (window.toastr) toastr.success(message);
        else console.log("[Toast]", message);
    } catch (err) {}
    mengLog(message);
}

function getSTContext() {
    try { return window.SillyTavern?.getContext?.(); } catch (err) { return null; }
}

// ===== 安全等待（超时不抛异常） =====
async function waitForCondition({ check, timeout = 15000, interval = 200, name = "Unknown" }) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            if (check()) {
                mengLog(`✅ ${name} 已就绪`);
                return true;
            }
        } catch (err) {}
        await new Promise(r => setTimeout(r, interval));
    }
    mengLog(`⚠️ ${name} 等待超时，插件将继续但可能功能不全`);
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
    showToast: true,
    showLogs: true,
    debug: false,
    maxTextLength: 500000,
    nameFixRules: [{ from: "林晟", to: "林晨", enabled: true }],
    simpleReplacements: [],
    regexRules: [],
    contextRules: [],
};
let settings = structuredClone(defaultSettings);

// ===== 设置加载与保存 =====
async function loadSettings() {
    try {
        const context = getSTContext();
        if (!context) return;
        const ext = context.extension_settings || {};
        const saved = ext[PLUGIN_ID];
        if (saved) {
            settings = Object.assign({}, defaultSettings, saved);
            mengLog("📂 已读取持久化设置");
        } else {
            settings = structuredClone(defaultSettings);
            ext[PLUGIN_ID] = structuredClone(settings);
            context.saveSettingsDebounced?.();
            mengLog("🆕 已创建默认设置");
        }
        settings.nameFixRules = Array.isArray(settings.nameFixRules) ? settings.nameFixRules : [];
        settings.simpleReplacements = Array.isArray(settings.simpleReplacements) ? settings.simpleReplacements : [];
        settings.regexRules = Array.isArray(settings.regexRules) ? settings.regexRules : [];
        settings.contextRules = Array.isArray(settings.contextRules) ? settings.contextRules : [];
        for (const rule of settings.regexRules) {
            try {
                if (!rule._regex && rule.pattern) {
                    rule._regex = new RegExp(rule.pattern, rule.flags || "g");
                }
            } catch (err) {
                mengLog(`⚠️ Regex编译失败: ${rule.pattern}`);
            }
        }
        window.MengRuntime.settingsLoaded = true;
        mengLog("✅ 设置加载完成");
    } catch (err) {
        console.error(err);
        mengLog("💥 设置加载崩溃");
    }
}

async function saveSettings() {
    try {
        const context = getSTContext();
        if (!context) return false;
        context.extension_settings = context.extension_settings || {};
        context.extension_settings[PLUGIN_ID] = structuredClone(settings);
        await context.saveSettingsDebounced?.();
        mengLog("💾 设置已持久化保存");
        return true;
    } catch (err) {
        console.error(err);
        mengLog("💥 saveSettings 崩溃");
        return false;
    }
}

// ===== 模块等待 =====
async function waitModulesReady() {
    mengLog("⏳ 等待核心模块就绪...");
    window.MengRuntime.cleanerLoaded = await waitForCondition({
        name: "MengCleaner",
        check: () => !!(window.MengCleaner && typeof window.MengCleaner.cleanText === "function"),
    });
    window.MengRuntime.uiLoaded = await waitForCondition({
        name: "MengUI",
        check: () => !!(window.MengUI && typeof window.MengUI.openMengPanel === "function"),
    });
    window.MengRuntime.rulesLoaded = await waitForCondition({
        name: "RuleManager",
        check: () => !!window.MengRuleManager,
    });
    mengLog("✅ 核心模块检查完成");
}

// ===== 全局状态初始化 =====
function initGlobalState() {
    window.MengYanChen.correctNames = window.MengYanChen.correctNames || new Set(["林晨", "谢知许", "洛君瑾"]);
    window.MengYanChen.pendingConfirmations = window.MengYanChen.pendingConfirmations || [];
    window.MengYanChen.messageCache = window.MengYanChen.messageCache || new WeakSet();
    mengLog("🧠 全局状态初始化完成");
}

// ===== 预初始化 =====
async function preInit() {
    if (window.MengRuntime.initializing) {
        mengLog("⚠️ 初始化已在进行中");
        return;
    }
    window.MengRuntime.initializing = true;
    mengLog("🚀 开始预初始化");
    await loadSettings();
    initGlobalState();
    await waitModulesReady();
    mengLog("✅ 预初始化完成");
}

// ===== 消息清洗 =====
function isAlreadyCleaned(msg) {
    if (!msg) return true;
    if (msg._meng_cleaned) return true;
    return window.MengYanChen?.messageCache?.has(msg) || false;
}

function markCleaned(msg) {
    if (!msg) return;
    msg._meng_cleaned = true;
    try { window.MengYanChen?.messageCache?.add(msg); } catch (err) {}
}

function getMessageField(msg) {
    if (!msg) return null;
    if (typeof msg.mes === "string") return "mes";
    if (typeof msg.content === "string") return "content";
    return null;
}

function updateMessageDOM(messageId, cleaned) {
    try {
        const el = document.querySelector(`#chat .mes[mesid="${messageId}"] .mes_text`);
        if (el) {
            el.textContent = cleaned;
            return true;
        }
    } catch (err) {}
    return false;
}

async function processMessage(msg, messageId) {
    try {
        if (!window.MengCleaner || typeof window.MengCleaner.cleanText !== "function") return;
        if (!msg || isAlreadyCleaned(msg)) return;
        const field = getMessageField(msg);
        if (!field) return;
        const original = msg[field];
        if (!original || typeof original !== "string") return;

        mengLog(`🧹 开始清洗消息 ${messageId}`);
        let cleaned = original;
        try {
            cleaned = await window.MengCleaner.cleanText(original, settings);
        } catch (err) {
            console.error(err);
            mengLog(`💥 cleanText执行失败: ${messageId}`);
            return;
        }

        if (cleaned === original) {
            markCleaned(msg);
            return;
        }

        msg[field] = cleaned;
        markCleaned(msg);

        try {
            const context = getSTContext();
            const chat = context?.chat;
            if (chat?.[messageId]) {
                chat[messageId][field] = cleaned;
                chat[messageId]._meng_cleaned = true;
            }
        } catch (err) {}

        updateMessageDOM(messageId, cleaned);
        mengLog(`✅ 消息 ${messageId} 清洗完成`);
    } catch (err) {
        console.error(err);
        mengLog(`💥 processMessage崩溃: ${messageId}`);
    }
}

// ===== 消息监听 =====
function bindMessageEvents() {
    try {
        const context = getSTContext();
        if (!context || context._meng_bound) return;
        if (!context.eventSource) {
            setTimeout(bindMessageEvents, 1500);
            return;
        }
        context._meng_bound = true;

        const bindEvent = (eventType, name) => {
            context.eventSource.on(eventType, async (...args) => {
                try {
                    if (eventType === context.event_types.CHAT_CHANGED) return;
                    const rawId = args?.[0];
                    const messageId = Number(rawId);
                    if (isNaN(messageId)) return;
                    const msg = context.chat?.[messageId];
                    if (!msg) return;
                    mengLog(`📨 捕获${name}: ${messageId}`);
                    await processMessage(msg, messageId);
                } catch (err) {
                    console.error(err);
                    mengLog(`💥 ${name}监听崩溃`);
                }
            });
        };

        bindEvent(context.event_types.CHARACTER_MESSAGE_RENDERED, "角色消息");
        bindEvent(context.event_types.USER_MESSAGE_RENDERED, "用户消息");
        bindEvent(context.event_types.MESSAGE_SWIPED, "消息切换");
        bindEvent(context.event_types.CHAT_CHANGED, "聊天切换");
        mengLog("🎧 消息监听绑定完成");
    } catch (err) {
        console.error(err);
        mengLog("💥 bindMessageEvents崩溃");
    }
}

// ===== 自动保存 =====
function setupAutoSave() {
    if (window.MengRuntime.autoSaveStarted) return;
    window.MengRuntime.autoSaveStarted = true;
    setInterval(() => {
        try { saveSettings(); } catch (err) {}
    }, 30000);
    mengLog("💾 自动保存已启动");
}

// ===== UI 注入 =====
async function injectPandaButton() {
    try {
        if (!window.MengUI || typeof window.MengUI.injectPandaButton !== "function") {
            mengLog("⚠️ MengUI 未就绪，无法注入 Panda 按钮");
            return;
        }
        const context = {
            settings,
            extension_settings: getSTContext()?.extension_settings,
            saveSettingsDebounced: saveSettings,
            PLUGIN_ID,
            mengLog,
            mengToast,
        };
        window.MengUI.injectPandaButton(context);
    } catch (err) {
        console.error(err);
        mengLog("💥 Panda注入失败");
    }
}

function createFloatingLogButton() {
    if ($("#meng-log-floating-btn").length) return;
    const btn = $(`
        <div id="meng-log-floating-btn" style="
            position:fixed; right:16px; bottom:18px; z-index:999999;
            background:rgba(170,255,200,0.12); border:1px solid rgba(170,255,200,0.18);
            backdrop-filter:blur(6px); padding:8px 12px; border-radius:14px;
            cursor:pointer; font-size:0.9rem; color:#d8ffe7; user-select:none;
        ">📜 日志</div>
    `);
    btn.on("click", () => {
        const logBox = $("#meng-live-log");
        if (!logBox.length) {
            mengToast("⚠️ 当前没有日志面板");
            return;
        }
        logBox.toggle();
        mengLog(`📜 日志已${logBox.is(":visible") ? "显示" : "隐藏"}`);
    });
    $("body").append(btn);
    mengLog("📜 浮动日志按钮已创建");
}

// ===== 最终启动 =====
(async () => {
    try {
        mengLog("🌿 梦晏晨 index.js 开始执行");

        await preInit();

        if (window.MengRuleManager?.registerUpdateCallback) {
            window.MengRuleManager.registerUpdateCallback(async (newSettings) => {
                try {
                    if (!newSettings) return;
                    settings = Object.assign({}, settings, structuredClone(newSettings));
                    await saveSettings();
                    mengLog("🔄 RuleManager设置已同步");
                } catch (err) {
                    mengLog("⚠️ RuleManager同步失败");
                }
            });
            mengLog("📡 RuleManager监听完成");
        }

        setInterval(() => {
            try {
                if (!$("#meng-panda-btn").length) injectPandaButton();
                if (!$("#meng-log-floating-btn").length) createFloatingLogButton();
            } catch (err) {}
        }, 10000);
        mengLog("🛡️ UI恢复器已启动");

        if (window.__ST_IMPORT_EXPORT_MODE__) {
            mengLog("⚠️ 导入模式，跳过启动");
            return;
        }
        if (document.readyState === "loading") {
            await new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
        }

        await injectPandaButton();
        createFloatingLogButton();
        bindMessageEvents();
        setupAutoSave();

        window.MengYanChenAPI = {
            settings,
            saveSettings,
            loadSettings,
            injectPandaButton,
            processMessage,
            mengLog,
            mengToast,
        };

        mengLog("🌟 全部模块运行完成");
        console.log("[梦晏晨] 插件启动完成");
    } catch (err) {
        console.error(err);
        mengLog("💥 index.js最终启动崩溃");
        alert("⚠️ 梦晏晨启动失败，请查看控制台日志");
    }
})();