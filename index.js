(async () => {
    console.log("[梦晏晨] 插件加载初始化");

    // ===== 求求别崩溃了，异步安全导入模块 =====
    let cleanerModule = {};
    let uiModule = {};
    try { cleanerModule = await import("./cleaner.js"); } 
    catch (e) { console.warn("[梦晏晨] cleaner 模块加载失败", e); }

    try { uiModule = await import("./ui.js"); } 
    catch (e) { console.warn("[梦晏晨] ui 模块加载失败", e); }

    window.MengCleaner = cleanerModule?.MengCleaner;

    // ===== 安全注入 Panda 按钮 =====
    function injectPandaButton(context) {
        const target = $("#data_bank_wand_container");
        if (!target.length) { setTimeout(() => injectPandaButton(context), 500); return; }
        if ($("#meng-panda-btn").length) return;

        const btn = $(`
<div id="meng-panda-btn" style="cursor:pointer;padding:6px 10px;border-radius:12px;background:rgba(255,255,255,0.08);display:flex;align-items:center;gap:6px;font-size:1rem;margin-top:4px;">
<span>🐼</span><span>梦晏晨</span>
</div>`);
        btn.on("click", () => window.MengUI.openMengPanel?.(context));
        target.append(btn);
        console.log("[梦晏晨] 🐼 已成功注入");
    }

    // ===== 安全挂载 UI 模块 =====

    window.MengUI = {
        openMengPanel: uiModule.openMengPanel,
        injectPandaButton: uiModule.injectPandaButton,
    };

    const PLUGIN_ID = "meng-yan-chen";
    const context = window.SillyTavern?.getContext?.();
    const extension_settings = context?.extension_settings || {};
    const saveSettingsDebounced = context?.saveSettingsDebounced || (() => {});

    // ===== 默认设置 =====
    const defaultSettings = {
        nameFixMap: { "林晟": "林晨", "林辰": "林晨" },
        simpleReplacements: [{ from: "眸子", to: "眼睛", enabled: true }],
        regexRules: [],
        contextRules: []
    };

    let settings = Object.assign({}, defaultSettings, extension_settings[PLUGIN_ID] || {});

    settings.regexRules.forEach(rule => { 
        if (!rule._regex) rule._regex = new RegExp(rule.pattern, rule.flags || "g"); 
    });
    extension_settings[PLUGIN_ID] = settings;

    // ===== 全局管理 pendingConfirmations / correctNames =====
    window.MengYanChen = window.MengYanChen || {};
    window.MengYanChen.correctNames = window.MengYanChen.correctNames || new Set(['林晨','谢知许','洛君瑾']);
    window.MengYanChen.pendingConfirmations = window.MengYanChen.pendingConfirmations || [];

    // ===== 消息处理函数 =====
    function processMessage(msg, messageId) {
        if (!window.MengCleaner || !msg || (!msg.mes && !msg.content) || msg._meng_cleaned) return;
        const field = msg.mes ? "mes" : "content";
        const cleaned = window.MengCleaner.cleanText(msg[field], settings);
        if (cleaned !== msg[field]) {
            msg[field] = cleaned;
            msg._meng_cleaned = true;
            const chat = window.SillyTavern?.getContext?.()?.chat;
            if (chat?.[messageId]) { chat[messageId][field] = cleaned; chat[messageId]._meng_cleaned = true; }
            const mesBlock = document.querySelector(`#chat .mes[mesid="${messageId}"] .mes_text`);
            if (mesBlock) mesBlock.textContent = cleaned;
        }
    }

    // ===== 安全挂载 processMessageWithLearning =====
    function safeMountProcessMessage() {
        if (!window.MengUI) window.MengUI = {};
        if (typeof processMessage !== 'function') { setTimeout(safeMountProcessMessage, 500); return; }
        window.MengUI.processMessageWithLearning = (msg, id, settings) => {
            try { processMessage(msg, id, settings); } 
            catch (err) { console.error("[梦晏晨] processMessageWithLearning 错误:", err); }
        };
        console.log("[梦晏晨] processMessageWithLearning 挂载完成");
    }
    safeMountProcessMessage();

    // ===== 延迟注入 Panda 按钮 =====
    function tryInjectPanda(context) {
        if (!$("#data_bank_wand_container").length) { setTimeout(() => tryInjectPanda(context), 500); return; }
        if (!window.MengUI?.injectPandaButton) { setTimeout(() => tryInjectPanda(context), 500); return; }
        if ($("#meng-panda-btn").length) return;
        window.MengUI.injectPandaButton({ settings, extension_settings, saveSettingsDebounced, PLUGIN_ID });
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
                if (msg) processMessage(msg, messageId);
            });
        };
        bindEvent(context.event_types.CHARACTER_MESSAGE_RENDERED);
        bindEvent(context.event_types.USER_MESSAGE_RENDERED);
        context.eventSource.on(context.event_types.CHAT_CHANGED, (...args) => { console.log("[梦晏晨] 聊天切换事件", args); });
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