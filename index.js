// main.js
(async () => {
    console.log("[梦晏晨] 插件加载初始化");

    const PLUGIN_ID = "meng-yan-chen"; // ID可以保持原样
    const context = window.SillyTavern?.getContext?.();
    const extension_settings = context?.extension_settings || {};
    const saveSettingsDebounced = context?.saveSettingsDebounced || (() => {});

    // ===== 永久规则管理 =====
    try {
        const RuleManagerModule = await import("./ruleManager.js");
        const RuleManager = RuleManagerModule.default;
        window.MengRuleManager = RuleManager; // 全局挂载仍可兼容旧逻辑

        window.梦晏晨规则 = RuleManager.loadRules();
        window.梦晏晨规则保存 = (newRules) => {
            window.梦晏晨规则 = newRules;
            RuleManager.saveRules(newRules);
        };
        window.梦晏晨规则添加 = (rule) => {
            RuleManager.addRule(rule);
            window.梦晏晨规则 = RuleManager.loadRules();
        };
        window.梦晏晨规则删除 = (index) => {
            RuleManager.removeRule(index);
            window.梦晏晨规则 = RuleManager.loadRules();
        };

        console.log("[梦晏晨] 永久规则已加载", window.梦晏晨规则);
    } catch (e) {
        console.warn("[梦晏晨] RuleManager 加载失败！", e);
        window.梦晏晨规则 = [];
        window.梦晏晨规则保存 = () => {};
    }

    // ===== 异步加载其他模块 =====
    const cleanerPromise = import("./cleaner.js")
        .then(m => { window.梦晏晨清理器 = m.梦晏晨清理器 || m.default; })
        .catch(e => { console.warn("[梦晏晨] cleaner加载失败", e); });

    const uiPromise = import("./ui.js")
        .then(m => {
            window.梦晏晨UI = m;
            if (m.init) m.init(document.body); // UI 挂载到 body 或指定容器
            console.log("[梦晏晨] UI加载完成");
        })
        .catch(e => { console.warn("[梦晏晨] UI加载失败", e); });

    // ===== 默认设置 =====
    const defaultSettings = {
        nameFixRules: [
           { from:"林晟", to:"林晨", enabled:true },
           { from:"林辰", to:"林晨", enabled:true }
        ],
        simpleReplacements: [{ from: "眸子", to: "眼睛", enabled: true }],
        regexRules: [],
        contextRules: []
    };

    const settings = Object.assign({}, defaultSettings, extension_settings[PLUGIN_ID] || {});
    for (const key of Object.keys(settings)) {
        if (!(key in defaultSettings)) delete settings[key];
    }
    extension_settings[PLUGIN_ID] = settings;

    (settings.regexRules || []).forEach(rule => {
        try {
            if (!rule._regex) rule._regex = new RegExp(rule.pattern, rule.flags || "g");
        } catch(err){
            console.warn("[梦晏晨] 非法正则:", rule.pattern);
        }
    });

    // ===== 全局管理 pendingConfirmations / correctNames =====
    window.梦晏晨 = window.梦晏晨 || {};
    window.梦晏晨.correctNames = window.梦晏晨.correctNames || new Set(['林晨','谢知许','洛君瑾']);
    window.梦晏晨.pendingConfirmations = window.梦晏晨.pendingConfirmations || [];

    // ===== 消息处理函数 =====
    async function processMessage(msg, messageId) {
        if (!window.梦晏晨清理器 || !msg || (!msg.mes && !msg.content) || msg._梦晏晨清理过) return;
        const field = msg.mes ? "mes" : "content";
        const cleaned = await window.梦晏晨清理器.cleanText(msg[field], settings);
        if (cleaned !== msg[field]) {
            msg[field] = cleaned;
            msg._梦晏晨清理过 = true;
            const chat = window.SillyTavern?.getContext?.()?.chat;
            if (chat?.[messageId]) { chat[messageId][field] = cleaned; chat[messageId]._梦晏晨清理过 = true; }
            const mesBlock = document.querySelector(`#chat .mes[mesid="${messageId}"] .mes_text`);
            if (mesBlock) mesBlock.textContent = cleaned;
        }
    }

    // ===== 安全挂载 processMessageWithLearning =====
    function safeMountProcessMessage() {
        if (!window.梦晏晨UI) window.梦晏晨UI = {};
        if (typeof processMessage !== 'function') { setTimeout(safeMountProcessMessage, 500); return; }
        window.梦晏晨UI.processMessageWithLearning = (msg, id) => {
            try { processMessage(msg, id, settings); } 
            catch (err) { console.error("[梦晏晨] processMessageWithLearning 错误:", err); }
        };
        console.log("[梦晏晨] processMessageWithLearning 挂载完成");
    }
    safeMountProcessMessage();

    // ===== 延迟注入 Panda 按钮 =====
    function tryInjectPanda() {
        if (!$("#data_bank_wand_container").length) { setTimeout(tryInjectPanda, 500); return; }
        if (!window.梦晏晨UI?.injectPandaButton) { setTimeout(tryInjectPanda, 500); return; }
        if ($("#梦晏晨-panda-btn").length) return;
        window.梦晏晨UI.injectPandaButton({ settings, extension_settings, saveSettingsDebounced, PLUGIN_ID });
    }

    // ===== 绑定消息事件 =====
    function bindEvents() {
        const ctx = window.SillyTavern?.getContext?.();
        if (!ctx?.eventSource) { setTimeout(bindEvents, 500); return; }
        if (ctx._梦晏晨_bound) return;
        ctx._梦晏晨_bound = true;

        console.log("[梦晏晨] 开始监听消息");
        const bindEvent = (eventType) => {
            ctx.eventSource.on(eventType, (...args) => {
                const messageId = Number(args?.[0]);
                const msg = ctx.chat?.[messageId];
                if (msg) processMessage(msg, messageId).catch(console.error);
            });
        };
        bindEvent(ctx.event_types.CHARACTER_MESSAGE_RENDERED);
        bindEvent(ctx.event_types.USER_MESSAGE_RENDERED);
        ctx.eventSource.on(ctx.event_types.CHAT_CHANGED, (...args) => {
            console.log("[梦晏晨] 聊天切换事件", args);
        });
    }

    // ===== 初始化入口 =====
    if (!window.__ST_IMPORT_EXPORT_MODE__) {
        $(document).ready(() => {
            console.log("[梦晏晨] 插件已启动");
            tryInjectPanda();
            bindEvents();
        });
    }

    await Promise.all([cleanerPromise, uiPromise]);

    console.log("[梦晏晨] 插件初始化完成 ✅");
})();