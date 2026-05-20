// index.js
(async () => {
    console.log("[梦晏晨] 插件加载初始化");

    const PLUGIN_ID = "meng-yan-chen";
    const context = window.SillyTavern?.getContext?.();
    const extension_settings = context?.extension_settings || {};
    const saveSettingsDebounced = context?.saveSettingsDebounced || (() => {});

    // ===== 永久规则管理 =====
    if (!window.MengRuleManager) {
        console.warn("[梦晏晨] RuleManager 未加载！此时保存规则无效");
        window.MengRules = [];
        window.MengRulesSave = () => {};
    } else {
        window.MengRules = await window.MengRuleManager.loadRules();
        window.MengRulesSave = (newRules) => {
            window.MengRules = newRules;
            window.MengRuleManager.saveRules(newRules);
            console.log("[梦晏晨] 规则已保存 ✅", newRules.length, "条");
        };
        console.log("[梦晏晨] 永久规则已加载", window.MengRules.length, "条");
    }

    // ===== 加载 Cleaner =====
    try {
        const { MengCleaner } = await import("./MengCleaner.js");
        window.MengCleaner = MengCleaner;
        await MengCleaner.init();
        console.log("[梦晏晨] MengCleaner加载完成 ✅");
    } catch (e) {
        console.error("[梦晏晨] MengCleaner加载失败 ❌", e);
    }

    // ===== 加载 UI =====
    try {
        const uiModule = await import("./ui.js");
        window.MengUI = uiModule;
        console.log("[梦晏晨] UI 加载完成 ✅");
    } catch (e) {
        console.error("[梦晏晨] UI加载失败 ❌", e);
    }

    // ===== 默认设置 =====
    const defaultSettings = {
        nameFixRules: [
           {from:"林晟", to:"林晨", enabled:true},
           {from:"林辰", to:"林晨", enabled:true}
        ],
        simpleReplacements: [{ from: "眸子", to: "眼睛", enabled: true }],
        regexRules: [],
        contextRules: []
    };

    const settings = Object.assign({}, defaultSettings, extension_settings[PLUGIN_ID] || {});
    extension_settings[PLUGIN_ID] = settings;

    // ===== 消息队列 =====
    window.MengQueue = window.MengQueue || [];
    function enqueueMessage(msg, id) { window.MengQueue.push({msg, id}); }

    async function processMessage(msg, messageId) {
        if (!window.MengCleaner || !msg || (!msg.mes && !msg.content) || msg._meng_cleaned) return;
        const field = msg.mes ? "mes" : "content";

        requestAnimationFrame(async () => {
            try {
                const cleaned = await window.MengCleaner.cleanText(msg[field], settings);
                if (cleaned !== msg[field]) {
                    msg[field] = cleaned;
                    msg._meng_cleaned = true;

                    const chat = window.SillyTavern?.getContext?.()?.chat;
                    if (chat?.[messageId]) {
                        chat[messageId][field] = cleaned;
                        chat[messageId]._meng_cleaned = true;
                    }

                    const mesBlock = document.querySelector(`#chat .mes[mesid="${messageId}"] .mes_text`);
                    if (mesBlock) mesBlock.textContent = cleaned;

                    console.log(`[梦晏晨] 消息 ${messageId} 已清理`);
                }
            } catch(err) {
                console.error("[梦晏晨] processMessage 错误:", err);
            }
        });
    }

    setInterval(async () => {
        if (!window.MengQueue.length) return;
        const batch = window.MengQueue.splice(0, 5);
        for (const {msg, id} of batch) await processMessage(msg, id);
    }, 100);

    // ===== 安全挂载 processMessageWithLearning =====
    function safeMountProcessMessage() {
        if (!window.MengUI) window.MengUI = {};
        if (typeof processMessage !== 'function') { setTimeout(safeMountProcessMessage, 500); return; }
        window.MengUI.processMessageWithLearning = (msg, id, settings) => {
            try { enqueueMessage(msg, id); } 
            catch (err) { console.error("[梦晏晨] processMessageWithLearning 错误:", err); }
        };
        console.log("[梦晏晨] processMessageWithLearning 挂载完成");
    }
    safeMountProcessMessage();

    // ===== 注入 Panda 按钮 =====
    function tryInjectPanda(context) {
        if (!$("#data_bank_wand_container").length) { setTimeout(() => tryInjectPanda(context), 500); return; }
        if (!window.MengUI?.injectPandaButton) { setTimeout(() => tryInjectPanda(context), 500); return; }
        if ($("#meng-panda-btn").length) return;
        window.MengUI.injectPandaButton({ settings, extension_settings, saveSettingsDebounced, PLUGIN_ID });
        console.log("[梦晏晨] Panda按钮注入完成");
    }

    // ===== 绑定消息事件 =====
    function bindEvents() {
        const context = window.SillyTavern?.getContext?.();
        if (!context?.eventSource) { setTimeout(bindEvents, 500); return; }
        if (context._meng_bound) return;
        context._meng_bound = true;

        console.log("[梦晏晨] 开始监听消息");

        const bindEvent = (eventType) => {
            context.eventSource.on(eventType, (...args) => {
                const messageId = Number(args?.[0]);
                const msg = context.chat?.[messageId];
                if (msg) enqueueMessage(msg, messageId);
            });
        };
        bindEvent(context.event_types.CHARACTER_MESSAGE_RENDERED);
        bindEvent(context.event_types.USER_MESSAGE_RENDERED);
        context.eventSource.on(context.event_types.CHAT_CHANGED, (...args) => {
            console.log("[梦晏晨] 聊天切换事件", args);
        });
    }

    // ===== 初始化入口 =====
    if (!window.__ST_IMPORT_EXPORT_MODE__) {
        $(document).ready(() => {
            console.log("[梦晏晨] 插件已启动");
            tryInjectPanda({ settings, extension_settings, saveSettingsDebounced, PLUGIN_ID });
            bindEvents();
        });
    }

})();