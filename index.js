(async () => {
    console.log("[梦晏晨] 插件加载初始化");

    const PLUGIN_ID = "meng-yan-chen";

    // ===== RuleManager 初始化 =====
    let RuleManager, ruleManagerInstance;
    try {
        const module = await import("./RuleManager.js");
        RuleManager = module?.default || module.RuleManager;
        if (!RuleManager) throw new Error("RuleManager 导出异常");
        console.log("[梦晏晨] RuleManager 导入成功 ✅");

        ruleManagerInstance = new RuleManager();
        window.MengRules = await ruleManagerInstance.loadRules();
        window.MengRulesSave = (newRules) => {
            window.MengRules = newRules;
            ruleManagerInstance.saveRules(newRules);
        };
        console.log("[梦晏晨] 永久规则已加载", window.MengRules);
    } catch (err) {
        console.warn("[梦晏晨] RuleManager 未加载！此时保存规则无效", err);
        window.MengRules = [];
        window.MengRulesSave = () => {};
    }

    // ===== 异步加载 Cleaner =====
    let cleanerReady = false;
    let cleanerPromise = import("./cleaner.js")
        .then(m => {
           window.MengCleaner = m.MengCleaner || m.default;
           cleanerReady = true;
        })
        .catch(e => {
            console.warn("[Meng] cleaner加载失败", e);
        });

    // ===== 异步加载 UI =====
    let uiPromise = import("./ui.js")
        .then(m => {
            window.MengUI = m;
            console.log("[梦晏晨] UI 加载完成");
        })
        .catch(e => {
            console.warn("[梦晏晨] UI 加载失败", e);
        });
        
    // ===== 获取 TauriTavern 上下文 =====
    const context = window.SillyTavern?.getContext?.();
    const extension_settings = context?.extension_settings || {};
    const saveSettingsDebounced = context?.saveSettingsDebounced || (() => {});

    // ===== 默认设置 =====
    const defaultSettings = {
        nameFixRules: [
            { from: "林晟", to: "林晨", enabled: true },
            { from: "林辰", to: "林晨", enabled: true }
        ],
        simpleReplacements: [{ from: "眸子", to: "眼睛", enabled: true }],
        regexRules: [],
        contextRules: []
    };
    
    let settings = Object.assign({}, defaultSettings, extension_settings[PLUGIN_ID] || {});
    // 🧼 清理未知字段（防污染）
    for (const key of Object.keys(settings)) {
        if (!(key in defaultSettings)) {
            console.warn("[梦晏晨] 删除未知配置字段:", key);
            delete settings[key];
        }
    }
    settings.regexRules.forEach(rule => {
        try {
            if (!rule._regex) {
                rule._regex = new RegExp(rule.pattern, rule.flags || "g");
            }
        } catch(err){
            console.warn("[梦晏晨] 非法正则:", rule.pattern);
        }
    });
    extension_settings[PLUGIN_ID] = settings;

    // ===== 全局管理 pendingConfirmations / correctNames =====
    window.MengYanChen = window.MengYanChen || {};
    window.MengYanChen.correctNames = window.MengYanChen.correctNames || new Set(['林晨','谢知许','洛君瑾']);
    window.MengYanChen.pendingConfirmations = window.MengYanChen.pendingConfirmations || [];

    // ===== 消息队列 =====
    async function processMessage(msg, messageId) {
        if (!window.MengCleaner || !msg || (!msg.mes && !msg.content) || msg._meng_cleaned) return;
        const field = msg.mes ? "mes" : "content";
        
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
                }
            } catch (err) {
                console.error("[梦晏晨] processMessage 错误:", err);
            }
        });

    // ===== 队列批量处理 =====
    setInterval(async () => {
        if (!window.MengQueue.length) return;
        const batch = window.MengQueue.splice(0, 5);
        for (const { msg, id } of batch) await processMessage(msg, id);
    }, 100);

    // ===== 安全挂载 processMessageWithLearning =====
    processMessageWithLearning =====
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
                if (msg) {
                     processMessage(msg, messageId).catch(console.error);
                 }
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