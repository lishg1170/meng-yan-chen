// ======================
// 梦晏晨 Ultimate Index
// index.js
// Part 1 / 6
// ======================

console.log("[梦晏晨] Ultimate Index 启动中...");

// ======================
// 全局状态
// ======================

window.MengRuntime = window.MengRuntime || {};

if (window.MengRuntime.indexLoaded) {

    console.warn("[梦晏晨] Index 已加载，阻止重复初始化");

} else {

    window.MengRuntime.indexLoaded = true;
}

// ======================
// 全局命名空间
// ======================

window.MengYanChen = window.MengYanChen || {};
window.MengLogs = window.MengLogs || [];

// ======================
// Runtime 状态
// ======================

Object.assign(window.MengRuntime, {

    uiLoaded: false,
    cleanerLoaded: false,
    rulesLoaded: false,
    panelOpened: false,
    pandaInjected: false,
    listenersBound: false,
    settingsLoaded: false,
    initializing: false,
    initialized: false,

    lastMessageCleanTime: 0,
});

// ======================
// 日志系统
// ======================

function mengLog(message, type = "log") {

    const time = new Date().toLocaleTimeString();

    const finalMsg =
        `🕒 [${time}] ${message}`;

    window.MengLogs.push(finalMsg);

    // 防止无限增长
    if (window.MengLogs.length > 1000) {

        window.MengLogs.shift();
    }

    console[type]("[梦晏晨]", message);

    // UI日志同步
    try {

        const logBox =
            document.querySelector("#meng-live-log");

        if (logBox) {

            logBox.textContent += finalMsg + "\n";

            logBox.scrollTop =
                logBox.scrollHeight;
        }

    } catch(err) {

        console.warn(
            "[梦晏晨] UI日志同步失败",
            err
        );
    }
}

// ======================
// Toast
// ======================

function mengToast(message) {

    try {

        if (window.toastr) {

            toastr.success(message);

        } else {

            console.log("[Toast]", message);
        }

    } catch(err) {

        console.warn(
            "[梦晏晨] Toast失败",
            err
        );
    }

    mengLog(message);
}

// ======================
// 安全等待函数
// ======================

async function waitForCondition({

    check,
    timeout = 15000,
    interval = 200,
    name = "Unknown"
}) {

    const start = Date.now();

    return new Promise((resolve, reject) => {

        const timer = setInterval(() => {

            try {

                if (check()) {

                    clearInterval(timer);

                    mengLog(
                        `✅ ${name} 已就绪`
                    );

                    resolve(true);

                    return;
                }

                if (
                    Date.now() - start >
                    timeout
                ) {

                    clearInterval(timer);

                    mengLog(
                        `⚠️ ${name} 等待超时`
                    );

                    reject(
                        new Error(
                            `${name} timeout`
                        )
                    );
                }

            } catch(err) {

                clearInterval(timer);

                reject(err);
            }

        }, interval);
    });
}

// ======================
// 安全获取 ST Context
// ======================

function getSTContext() {

    try {

        return window.SillyTavern
            ?.getContext?.();

    } catch(err) {

        mengLog(
            "⚠️ 获取 ST Context 失败"
        );

        return null;
    }
}

// ======================
// 默认设置
// ======================

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

    // 名字修正
    nameFixRules: [

        {
            from: "林晟",
            to: "林晨",
            enabled: true
        }
    ],

    // 简单替换
    simpleReplacements: [],

    // regex
    regexRules: [],

    // context
    contextRules: [],
};

mengLog("🧠 Index 初始化层已启动");

// ===== 下一部分继续 =====
// ======================
// index.js
// Part 2 / 6
// ======================

// ======================
// Settings
// ======================

let settings = structuredClone(defaultSettings);

// ======================
// 持久化读取
// ======================

async function loadSettings() {

    try {

        const context = getSTContext();

        if (!context) {

            mengLog(
                "⚠️ ST Context 不存在"
            );

            return;
        }

        const extension_settings =
            context.extension_settings || {};

        // ===== 读取旧设置 =====
        const saved =
            extension_settings[PLUGIN_ID];

        if (saved) {

            settings = Object.assign(
                {},
                structuredClone(defaultSettings),
                structuredClone(saved)
            );

            mengLog(
                "📂 已读取持久化设置"
            );

        } else {

            settings =
                structuredClone(
                    defaultSettings
                );

            extension_settings[PLUGIN_ID] =
                structuredClone(settings);

            context.saveSettingsDebounced?.();

            mengLog(
                "🆕 已创建默认设置"
            );
        }

        // ===== 安全修复 =====
        settings.nameFixRules =
            Array.isArray(
                settings.nameFixRules
            )
                ? settings.nameFixRules
                : [];

        settings.simpleReplacements =
            Array.isArray(
                settings.simpleReplacements
            )
                ? settings.simpleReplacements
                : [];

        settings.regexRules =
            Array.isArray(
                settings.regexRules
            )
                ? settings.regexRules
                : [];

        settings.contextRules =
            Array.isArray(
                settings.contextRules
            )
                ? settings.contextRules
                : [];

        // ===== regex预编译 =====
        for (const rule of settings.regexRules) {

            try {

                if (
                    !rule._regex &&
                    rule.pattern
                ) {

                    rule._regex =
                        new RegExp(
                            rule.pattern,
                            rule.flags || "g"
                        );
                }

            } catch(err) {

                mengLog(
                    `⚠️ Regex编译失败: ${rule.pattern}`
                );
            }
        }

        window.MengRuntime.settingsLoaded =
            true;

        mengLog(
            "✅ 设置加载完成"
        );

    } catch(err) {

        console.error(err);

        mengLog(
            "💥 设置加载崩溃"
        );
    }
}

// ======================
// 保存设置
// ======================

async function saveSettings() {

    try {

        const context = getSTContext();

        if (!context) {

            mengLog(
                "⚠️ saveSettings 获取context失败"
            );

            return false;
        }

        context.extension_settings =
            context.extension_settings || {};

        context.extension_settings[
            PLUGIN_ID
        ] = structuredClone(settings);

        await context
            .saveSettingsDebounced?.();

        mengLog(
            "💾 设置已持久化保存"
        );

        return true;

    } catch(err) {

        console.error(err);

        mengLog(
            "💥 saveSettings 崩溃"
        );

        return false;
    }
}

// ======================
// 模块等待
// ======================

async function waitModulesReady() {

    mengLog(
        "⏳ 等待模块加载..."
    );

    // ===== Cleaner =====
    await waitForCondition({

        name: "MengCleaner",

        check: () => {

            return !!(
                window.MengCleaner &&
                typeof window.MengCleaner
                    .cleanText === "function"
            );
        }
    });

    window.MengRuntime.cleanerLoaded =
        true;

    // ===== UI =====
    await waitForCondition({

        name: "MengUI",

        check: () => {

            return !!(
                window.MengUI &&
                typeof window.MengUI
                    .openMengPanel ===
                    "function"
            );
        }
    });

    window.MengRuntime.uiLoaded =
        true;

    // ===== RuleManager =====
    await waitForCondition({

        name: "RuleManager",

        check: () => {

            return !!(
                window.MengRuleManager
            );
        }
    });

    window.MengRuntime.rulesLoaded =
        true;

    mengLog(
        "✅ 所有模块已加载"
    );
}

// ======================
// 全局状态初始化
// ======================

function initGlobalState() {

    window.MengYanChen.correctNames =
        window.MengYanChen.correctNames
        || new Set([
            "林晨",
            "谢知许",
            "洛君瑾"
        ]);

    window.MengYanChen
        .pendingConfirmations =
        window.MengYanChen
            .pendingConfirmations || [];

    window.MengYanChen
        .messageCache =
        window.MengYanChen
            .messageCache || new WeakSet();

    mengLog(
        "🧠 全局状态初始化完成"
    );
}

// ======================
// 初始化入口
// ======================

async function preInit() {

    if (
        window.MengRuntime.initializing
    ) {

        mengLog(
            "⚠️ 初始化已在进行中"
        );

        return;
    }

    window.MengRuntime.initializing =
        true;

    mengLog(
        "🚀 开始预初始化"
    );

    await loadSettings();

    initGlobalState();

    await waitModulesReady();

    mengLog(
        "✅ 预初始化完成"
    );
}

// ===== 下一部分继续 =====
// ======================
// index.js
// Part 3 / 6
// ======================

// ======================
// Panda Button
// ======================

function createPandaButton() {

    return $(`
<div
    id="meng-panda-btn"
    style="
        cursor:pointer;
        padding:7px 12px;
        border-radius:14px;
        background:rgba(170,255,200,0.12);
        border:1px solid rgba(170,255,200,0.18);
        display:flex;
        align-items:center;
        gap:6px;
        font-size:0.95rem;
        margin-top:4px;
        color:#d8ffe7;
        transition:all 0.2s ease;
        user-select:none;
        backdrop-filter:blur(4px);
    "
>

<span style="font-size:1.05rem;">🐼</span>

<span>梦晏晨</span>

</div>
`);
}

// ======================
// Panda Hover
// ======================

function bindPandaEffects(btn) {

    btn.on("mouseenter", () => {

        btn.css({

            transform:
                "translateY(-1px)",

            background:
                "rgba(170,255,200,0.2)",

            boxShadow:
                "0 0 12px rgba(170,255,200,0.15)"
        });
    });

    btn.on("mouseleave", () => {

        btn.css({

            transform: "none",

            background:
                "rgba(170,255,200,0.12)",

            boxShadow: "none"
        });
    });
}

// ======================
// 注入 Panda
// ======================

async function injectPandaButton() {

    try {

        if (
            window.MengRuntime
                .pandaInjected
        ) {

            mengLog(
                "⚠️ Panda按钮已存在"
            );

            return;
        }

        const target =
            $("#data_bank_wand_container");

        // ===== 容器不存在 =====
        if (!target.length) {

            mengLog(
                "⏳ 等待 Panda 注入点..."
            );

            setTimeout(
                injectPandaButton,
                1000
            );

            return;
        }

        // ===== 已存在 =====
        if (
            $("#meng-panda-btn")
                .length
        ) {

            window.MengRuntime
                .pandaInjected = true;

            return;
        }

        const btn =
            createPandaButton();

        bindPandaEffects(btn);

        // ======================
        // 点击事件
        // ======================

        btn.on("click", async () => {

            try {

                mengLog(
                    "🐼 Panda按钮点击"
                );

                mengToast(
                    "🖥️ 梦晏晨面板启动中..."
                );

                if (
                    !window.MengUI
                ) {

                    throw new Error(
                        "MengUI不存在"
                    );
                }

                if (
                    typeof window
                        .MengUI
                        .openMengPanel
                    !== "function"
                ) {

                    throw new Error(
                        "openMengPanel不存在"
                    );
                }

                // ===== UI Context =====
                const context = {

                    settings,

                    extension_settings:
                        getSTContext()
                            ?.extension_settings,

                    saveSettingsDebounced:
                        saveSettings,

                    PLUGIN_ID,

                    mengLog,

                    mengToast,
                };

                // ===== 打开UI =====
                window.MengUI
                    .openMengPanel(
                        context
                    );

                window.MengRuntime
                    .panelOpened = true;

                mengLog(
                    "✅ UI面板打开成功"
                );

            } catch(err) {

                console.error(err);

                mengLog(
                    `💥 UI打开失败: ${err.message}`
                );

                alert(
                    "⚠️ 梦晏晨 UI 打开失败"
                );
            }
        });

        target.append(btn);

        window.MengRuntime
            .pandaInjected = true;

        mengLog(
            "✅ Panda按钮注入成功"
        );

        mengToast(
            "🐼 梦晏晨已加载"
        );

    } catch(err) {

        console.error(err);

        mengLog(
            "💥 Panda注入失败"
        );
    }
}

// ======================
// 日志按钮
// ======================

function createFloatingLogButton() {

    if (
        $("#meng-log-floating-btn")
            .length
    ) return;

    const btn = $(`
<div
id="meng-log-floating-btn"
style="
position:fixed;
right:16px;
bottom:18px;
z-index:999999;
background:rgba(170,255,200,0.12);
border:1px solid rgba(170,255,200,0.18);
backdrop-filter:blur(6px);
padding:8px 12px;
border-radius:14px;
cursor:pointer;
font-size:0.9rem;
color:#d8ffe7;
user-select:none;
"
>
📜 日志
</div>
`);

    btn.on("click", () => {

        const logBox =
            $("#meng-live-log");

        if (!logBox.length) {

            mengToast(
                "⚠️ 当前没有日志面板"
            );

            return;
        }

        logBox.toggle();

        mengLog(
            `📜 日志已${
                logBox.is(":visible")
                    ? "显示"
                    : "隐藏"
            }`
        );
    });

    $("body").append(btn);

    mengLog(
        "📜 浮动日志按钮已创建"
    );
}

// ===== 下一部分继续 =====
// ======================
// index.js
// Part 4 / 6
// ======================

// ======================
// 消息去重
// ======================

function isAlreadyCleaned(msg) {

    if (!msg) return true;

    if (msg._meng_cleaned) {

        return true;
    }

    if (
        window.MengYanChen
            .messageCache
            ?.has(msg)
    ) {

        return true;
    }

    return false;
}

// ======================
// 标记已清洗
// ======================

function markCleaned(msg) {

    if (!msg) return;

    msg._meng_cleaned = true;

    try {

        window.MengYanChen
            .messageCache
            ?.add(msg);

    } catch(err) {

        console.warn(err);
    }
}

// ======================
// 获取消息文本
// ======================

function getMessageField(msg) {

    if (!msg) return null;

    if (typeof msg.mes === "string") {

        return "mes";
    }

    if (
        typeof msg.content ===
        "string"
    ) {

        return "content";
    }

    return null;
}

// ======================
// 更新前端消息
// ======================

function updateMessageDOM(
    messageId,
    cleaned
) {

    try {

        const mesBlock =
            document.querySelector(
                `#chat .mes[mesid="${messageId}"] .mes_text`
            );

        if (!mesBlock) {

            return false;
        }

        mesBlock.textContent =
            cleaned;

        return true;

    } catch(err) {

        console.error(err);

        return false;
    }
}

// ======================
// 单条消息处理
// ======================

async function processMessage(
    msg,
    messageId
) {

    try {

        // ===== Cleaner检查 =====
        if (
            !window.MengCleaner
        ) {

            mengLog(
                "⚠️ Cleaner不存在"
            );

            return;
        }

        if (
            typeof window
                .MengCleaner
                .cleanText
            !== "function"
        ) {

            mengLog(
                "⚠️ cleanText不存在"
            );

            return;
        }

        // ===== 消息检查 =====
        if (!msg) return;

        if (
            isAlreadyCleaned(msg)
        ) {

            return;
        }

        const field =
            getMessageField(msg);

        if (!field) {

            return;
        }

        const original =
            msg[field];

        if (
            !original ||
            typeof original !==
                "string"
        ) {

            return;
        }

        // ======================
        // 开始清洗
        // ======================

        mengLog(
            `🧹 开始清洗消息 ${messageId}`
        );

        let cleaned =
            original;

        try {

            cleaned =
                await window
                    .MengCleaner
                    .cleanText(
                        original,
                        settings
                    );

        } catch(err) {

            console.error(err);

            mengLog(
                `💥 cleanText执行失败: ${messageId}`
            );

            return;
        }

        // ===== 无变化 =====
        if (
            cleaned === original
        ) {

            markCleaned(msg);

            return;
        }

        // ======================
        // 更新消息
        // ======================

        msg[field] = cleaned;

        markCleaned(msg);

        // ===== chat缓存 =====
        try {

            const context =
                getSTContext();

            const chat =
                context?.chat;

            if (
                chat?.[messageId]
            ) {

                chat[messageId][field] =
                    cleaned;

                chat[messageId]
                    ._meng_cleaned =
                    true;
            }

        } catch(err) {

            console.warn(err);
        }

        // ===== DOM =====
        updateMessageDOM(
            messageId,
            cleaned
        );

        mengLog(
            `✅ 消息 ${messageId} 清洗完成`
        );

    } catch(err) {

        console.error(err);

        mengLog(
            `💥 processMessage崩溃: ${messageId}`
        );
    }
}

// ======================
// 消息监听
// ======================

function bindMessageEvents() {

    try {

        const context =
            getSTContext();

        if (!context) {

            mengLog(
                "⚠️ bindMessageEvents 获取context失败"
            );

            setTimeout(
                bindMessageEvents,
                1500
            );

            return;
        }

        if (
            context._meng_bound
        ) {

            mengLog(
                "⚠️ 消息监听已绑定"
            );

            return;
        }

        if (
            !context.eventSource
        ) {

            mengLog(
                "⚠️ eventSource不存在"
            );

            setTimeout(
                bindMessageEvents,
                1500
            );

            return;
        }

        context._meng_bound =
            true;

        // ======================
        // 通用绑定函数
        // ======================

        const bindEvent = (
            eventType,
            name
        ) => {

            context.eventSource.on(
                eventType,

                async (...args) => {

                    try {

                        const messageId =
                            Number(
                                args?.[0]
                            );

                        if (
                            Number.isNaN(
                                messageId
                            )
                        ) {

                            return;
                        }

                        const msg =
                            context.chat?.[
                                messageId
                            ];

                        if (!msg) {

                            return;
                        }

                        mengLog(
                            `📨 捕获${name}: ${messageId}`
                        );

                        await processMessage(
                            msg,
                            messageId
                        );

                    } catch(err) {

                        console.error(err);

                        mengLog(
                            `💥 ${name}监听崩溃`
                        );
                    }
                }
            );
        };

        // ======================
        // 绑定事件
        // ======================

        bindEvent(
            context.event_types
                .CHARACTER_MESSAGE_RENDERED,
            "角色消息"
        );

        bindEvent(
            context.event_types
                .USER_MESSAGE_RENDERED,
            "用户消息"
        );

        bindEvent(
            context.event_types
                .MESSAGE_SWIPED,
            "消息切换"
        );

        bindEvent(
            context.event_types
                .CHAT_CHANGED,
            "聊天切换"
        );

        mengLog(
            "🎧 消息监听绑定完成"
        );

    } catch(err) {

        console.error(err);

        mengLog(
            "💥 bindMessageEvents崩溃"
        );
    }
}

// ===== 下一部分继续 =====
// ======================
// index.js
// Part 5 / 6
// ======================

// ======================
// 自动保存
// ======================

function setupAutoSave() {

    try {

        if (
            window.MengRuntime
                .autoSaveStarted
        ) {

            return;
        }

        window.MengRuntime
            .autoSaveStarted = true;

        // ======================
        // 定时持久化
        // ======================

        setInterval(() => {

            try {

                saveSettings();

            } catch(err) {

                console.error(err);

                mengLog(
                    "⚠️ 自动保存失败"
                );
            }

        }, 30000);

        mengLog(
            "💾 自动保存已启动"
        );

    } catch(err) {

        console.error(err);

        mengLog(
            "💥 setupAutoSave崩溃"
        );
    }
}

// ======================
// 恢复缓存
// ======================

function restoreRuntimeCache() {

    try {

        window.MengRuntime =
            window.MengRuntime || {};

        // ===== 消息缓存 =====
        if (
            !window.MengYanChen
                .messageCache
        ) {

            window.MengYanChen
                .messageCache =
                new WeakSet();
        }

        // ===== 日志缓存 =====
        if (
            !Array.isArray(
                window.MengRuntime
                    .logs
            )
        ) {

            window.MengRuntime
                .logs = [];
        }

        // ===== 状态 =====
        window.MengRuntime
            .started = true;

        mengLog(
            "♻️ Runtime缓存恢复完成"
        );

    } catch(err) {

        console.error(err);

        mengLog(
            "💥 restoreRuntimeCache崩溃"
        );
    }
}

// ======================
// Cleaner等待器
// ======================

async function waitCleanerReady() {

    let retry = 0;

    while (retry < 20) {

        try {

            if (
                window.MengCleaner &&
                typeof window
                    .MengCleaner
                    .cleanText ===
                    "function"
            ) {

                mengLog(
                    "✅ Cleaner已就绪"
                );

                return true;
            }

        } catch(err) {

            console.warn(err);
        }

        retry++;

        mengLog(
            `⏳ 等待Cleaner加载 (${retry}/20)`
        );

        await new Promise(r =>
            setTimeout(r, 500)
        );
    }

    mengLog(
        "⚠️ Cleaner等待超时"
    );

    return false;
}

// ======================
// RuleManager等待器
// ======================

async function waitRuleManagerReady() {

    let retry = 0;

    while (retry < 20) {

        try {

            if (
                window.MengRuleManager
            ) {

                mengLog(
                    "✅ RuleManager已就绪"
                );

                return true;
            }

        } catch(err) {

            console.warn(err);
        }

        retry++;

        mengLog(
            `⏳ 等待RuleManager (${retry}/20)`
        );

        await new Promise(r =>
            setTimeout(r, 500)
        );
    }

    mengLog(
        "⚠️ RuleManager等待超时"
    );

    return false;
}

// ======================
// 初始化模块
// ======================

async function initializeModules() {

    try {

        mengLog(
            "🚀 开始初始化模块"
        );

        // ======================
        // 等待模块
        // ======================

        await waitCleanerReady();

        await waitRuleManagerReady();

        // ======================
        // 规则同步
        // ======================

        if (
            window.MengRuleManager
                ?.syncSettings
        ) {

            try {

                await window
                    .MengRuleManager
                    .syncSettings(
                        settings
                    );

                mengLog(
                    "🔄 RuleManager同步完成"
                );

            } catch(err) {

                console.error(err);

                mengLog(
                    "⚠️ RuleManager同步失败"
                );
            }
        }

        // ======================
        // 自动保存
        // ======================

        setupAutoSave();

        // ======================
        // Panda按钮
        // ======================

        injectPandaButton();

        // ======================
        // 日志按钮
        // ======================

        createFloatingLogButton();

        // ======================
        // 监听消息
        // ======================

        bindMessageEvents();

        mengLog(
            "✅ 模块初始化完成"
        );

    } catch(err) {

        console.error(err);

        mengLog(
            "💥 initializeModules崩溃"
        );
    }
}

// ======================
// 页面启动
// ======================

async function startup() {

    try {

        // ===== 防重复 =====
        if (
            window.MengRuntime
                .booted
        ) {

            mengLog(
                "⚠️ 插件已启动"
            );

            return;
        }

        window.MengRuntime
            .booted = true;

        mengLog(
            "🌿 梦晏晨启动中..."
        );

        restoreRuntimeCache();

        await loadPersistSettings();

        await initializeModules();

        mengToast(
            "🌿 梦晏晨已成功启动"
        );

        mengLog(
            "🎉 梦晏晨启动完成"
        );

    } catch(err) {

        console.error(err);

        mengLog(
            "💥 startup崩溃"
        );
    }
}

// ===== 下一部分继续 =====
// ======================
// index.js
// Part 6 / 6
// Final
// ======================

// ======================
// 页面可见性监听
// ======================

document.addEventListener(
    "visibilitychange",

    () => {

        try {

            if (document.hidden) {

                mengLog(
                    "🌙 页面进入后台"
                );

                // ===== 后台自动保存 =====
                saveSettings();

            } else {

                mengLog(
                    "☀️ 页面重新激活"
                );
            }

        } catch(err) {

            console.error(err);
        }
    }
);

// ======================
// 页面关闭保存
// ======================

window.addEventListener(
    "beforeunload",

    () => {

        try {

            saveSettings();

            mengLog(
                "💾 页面关闭前保存完成"
            );

        } catch(err) {

            console.error(err);
        }
    }
);

// ======================
// ST导入模式检测
// ======================

function isImportMode() {

    try {

        return !!(
            window
                .__ST_IMPORT_EXPORT_MODE__
        );

    } catch(err) {

        return false;
    }
}

// ======================
// 安全启动
// ======================

async function safeStartup() {

    try {

        // ===== 导入模式 =====
        if (isImportMode()) {

            mengLog(
                "⚠️ 当前为导入模式，跳过启动"
            );

            return;
        }

        // ===== DOM等待 =====
        if (
            document.readyState ===
            "loading"
        ) {

            mengLog(
                "⏳ 等待DOM加载"
            );

            await new Promise(resolve => {

                document.addEventListener(
                    "DOMContentLoaded",

                    resolve,

                    {
                        once: true
                    }
                );
            });
        }

        mengLog(
            "📄 DOM已加载"
        );

        // ===== 启动 =====
        await startup();

    } catch(err) {

        console.error(err);

        mengLog(
            "💥 safeStartup崩溃"
        );
    }
}

// ======================
// RuleManager更新监听
// ======================

function bindRuleManagerUpdate() {

    try {

        if (
            !window
                .MengRuleManager
        ) {

            return;
        }

        if (
            typeof window
                .MengRuleManager
                .registerUpdateCallback
            !== "function"
        ) {

            return;
        }

        window.MengRuleManager
            .registerUpdateCallback(
                async (
                    newSettings
                ) => {

                    try {

                        if (
                            !newSettings
                        ) {

                            return;
                        }

                        settings =
                            Object.assign(
                                {},
                                settings,
                                structuredClone(
                                    newSettings
                                )
                            );

                        await saveSettings();

                        mengLog(
                            "🔄 RuleManager设置已同步"
                        );

                    } catch(err) {

                        console.error(err);

                        mengLog(
                            "⚠️ RuleManager同步失败"
                        );
                    }
                }
            );

        mengLog(
            "📡 RuleManager监听完成"
        );

    } catch(err) {

        console.error(err);

        mengLog(
            "💥 RuleManager监听崩溃"
        );
    }
}

// ======================
// UI恢复器
// ======================

function setupUIRecovery() {

    setInterval(() => {

        try {

            // ===== Panda丢失 =====
            if (
                !$("#meng-panda-btn")
                    .length
            ) {

                mengLog(
                    "♻️ Panda按钮丢失，重新注入"
                );

                injectPandaButton();
            }

            // ===== 日志按钮丢失 =====
            if (
                !$("#meng-log-floating-btn")
                    .length
            ) {

                createFloatingLogButton();
            }

        } catch(err) {

            console.error(err);
        }

    }, 10000);

    mengLog(
        "🛡️ UI恢复器已启动"
    );
}

// ======================
// Cleaner热更新
// ======================

function setupCleanerHotReload() {

    setInterval(() => {

        try {

            if (
                !window.MengCleaner
            ) {

                mengLog(
                    "⚠️ Cleaner丢失"
                );

                return;
            }

            if (
                typeof window
                    .MengCleaner
                    .cleanText !==
                "function"
            ) {

                mengLog(
                    "⚠️ cleanText失效"
                );
            }

        } catch(err) {

            console.error(err);
        }

    }, 15000);

    mengLog(
        "🔥 Cleaner热更新检测启动"
    );
}

// ======================
// 最终启动
// ======================

(async () => {

    try {

        mengLog(
            "🌿 梦晏晨 index.js 开始执行"
        );

        // ===== 初始化 =====
        await preInit();

        // ===== RuleManager监听 =====
        bindRuleManagerUpdate();

        // ===== UI恢复 =====
        setupUIRecovery();

        // ===== Cleaner热更新 =====
        setupCleanerHotReload();

        // ===== 安全启动 =====
        await safeStartup();

        // ===== 全局暴露 =====
        window.MengYanChenAPI = {

            settings,

            saveSettings,

            loadSettings:
                loadPersistSettings,

            injectPandaButton,

            processMessage,

            mengLog,

            mengToast,
        };

        mengLog(
            "🌟 全部模块运行完成"
        );

        console.log(
            "[梦晏晨] 插件启动完成"
        );

    } catch(err) {

        console.error(err);

        mengLog(
            "💥 index.js最终启动崩溃"
        );

        alert(
            "⚠️ 梦晏晨启动失败，请查看控制台日志"
        );
    }

})();

// ======================
// 导出
// ======================

export {

    settings,

    saveSettings,

    loadSettings,

    processMessage,

    injectPandaButton,
};```