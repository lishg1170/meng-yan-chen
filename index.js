(async () => {
    console.log("[梦晏晨] 插件加载初始化");

    // ===== 判断是否在导入/导出模式 =====
    const isImportExport = !!window.__ST_IMPORT_EXPORT_MODE__;

    // ===== 异步安全导入模块 =====
    let cleanerModule, uiModule;
    try {
        cleanerModule = await import("./cleaner.js");
    } catch (e) {
        console.warn("[梦晏晨] cleaner 模块加载失败", e);
    }

    try {
        uiModule = await import("./ui.js");
    } catch (e) {
        console.warn("[梦晏晨] ui 模块加载失败", e);
    }

    // ===== 全局挂载 =====
    window.MengCleaner = cleanerModule?.MengCleaner;
    window.MengUI = uiModule || {};

    const PLUGIN_ID = "meng-yan-chen";

    const extensions = window.SillyTavern?.extensions || {};
    const extension_settings = extensions.extension_settings || {};
    const saveSettingsDebounced = extensions.saveSettingsDebounced || (() => { });

    // ===== 默认设置 =====
    const defaultSettings = {
        nameFixMap: {
            "林晟": "林晨",
            "林辰": "林晨"
        },
        simpleReplacements: [
            { from: "眸子", to: "眼睛", enabled: true }
        ],
        regexRules: [
            {
                "pattern": "(指尖|深邃|博弈|精准|优雅|微颤|笼中鸟|缠绵|猎手|雕像|雕塑|评估|羁绊|宿命|升华|暗流涌动|不可名状)",
                "replace": "",
                "enabled": true
            },
            // ... 省略其他规则保持原样
        ],
        contextRules: []
    };

    // 合并用户设置
    let settings = Object.assign({}, defaultSettings, extension_settings[PLUGIN_ID] || {});

    // 预编译正则
    settings.regexRules.forEach(rule => {
        if (!rule._regex) rule._regex = new RegExp(rule.pattern, rule.flags || "g");
    });

    extension_settings[PLUGIN_ID] = settings;

    // 全局统一管理 pendingConfirmations 和 correctNames
    window.MengYanChen = window.MengYanChen || {};
    window.MengYanChen.correctNames = window.MengYanChen.correctNames || new Set(['林晨','谢知许','洛君瑾']);
    window.MengYanChen.pendingConfirmations = window.MengYanChen.pendingConfirmations || [];

    // ===== 消息处理函数 =====
    function processMessage(msg, messageId) {
        console.log("[梦晏晨] processMessage触发", msg);

        if (!window.MengCleaner) return;
        if (!msg?.mes && !msg?.content) return;
        if (msg._meng_cleaned) return;

        const field = msg.mes ? "mes" : "content";
        let cleaned = msg[field];

        cleaned = window.MengCleaner.cleanText(cleaned, settings);

        if (cleaned !== msg[field]) {
            msg[field] = cleaned;
            msg._meng_cleaned = true;

            const chat = window.SillyTavern?.getContext?.()?.chat;
            if (chat?.[messageId]) {
                chat[messageId][field] = cleaned;
                chat[messageId]._meng_cleaned = true;
            }

            const mesBlock = document.querySelector(`#chat .mes[mesid="${messageId}"] .mes_text`);
            if (mesBlock) {
                mesBlock.textContent = cleaned;
                console.log("[梦晏晨] DOM已更新");
            }
        }
    }

    // ===== 安全挂载 processMessageWithLearning =====
    function safeMountProcessMessage() {
        if (!window.MengUI) window.MengUI = {};

        if (typeof processMessage !== 'function') {
            console.warn("[梦晏晨] processMessage 未就绪，延迟挂载...");
            setTimeout(safeMountProcessMessage, 500);
            return;
        }

        window.MengUI.processMessageWithLearning = (msg, id, settings) => {
            try {
                processMessage(msg, id, settings);
            } catch (err) {
                console.error("[梦晏晨] processMessageWithLearning 错误:", err);
            }
        };

        console.log("[梦晏晨] processMessageWithLearning 挂载完成");
    }

    // 启动挂载
    safeMountProcessMessage();

    // ===== 延迟注入 Panda 按钮 =====
    function tryInjectPanda() {
        if ($("#data_bank_wand_container").length && window.MengUI) {
            window.MengUI.injectPandaButton({
                settings,
                extension_settings,
                saveSettingsDebounced,
                PLUGIN_ID
            });
        } else {
            setTimeout(tryInjectPanda, 500);
        }
    }

    // ===== 绑定事件 =====
    function bindEvents() {
        const context = window.SillyTavern?.getContext?.();
        if (!context?.eventSource) {
            setTimeout(bindEvents, 500);
            return;
        }
        if (context._meng_bound) return;
        context._meng_bound = true;

        console.log("[梦晏晨] 开始监听消息");

        const bindEvent = (eventType, logText) => {
            context.eventSource.on(eventType, (...args) => {
                console.log(`[梦晏晨] ${logText}`, args);
                const messageId = Number(args?.[0]);
                const msg = context.chat?.[messageId];
                if (msg) processMessage(msg, messageId);
            });
        };

        bindEvent(context.event_types.CHARACTER_MESSAGE_RENDERED, "角色消息事件触发");
        bindEvent(context.event_types.USER_MESSAGE_RENDERED, "用户消息事件触发");

        context.eventSource.on(context.event_types.CHAT_CHANGED, (...args) => {
            console.log("[梦晏晨] 聊天切换事件", args);
        });
    }

    // ===== 初始化入口 =====
    if (!isImportExport) {
        $(document).ready(() => {
            console.log("[梦晏晨] 插件已启动");
            tryInjectPanda();
            bindEvents();
        });
    }

})();