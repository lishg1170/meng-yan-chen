(async () => {
    console.log("[梦晏晨] 插件加载初始化");

    const PLUGIN_ID = "meng-yan-chen";
    const context = window.SillyTavern?.getContext?.();
    const extension_settings = context?.extension_settings || {};
    const saveSettingsDebounced = context?.saveSettingsDebounced || (() => {});

    // ===== 永久规则管理 =====
    if (!window.MengRuleManager) {
        console.warn("[梦晏晨] RuleManager 未加载！此时保存规则无效");
        window.MengRules = [];                     // 当前插件内存中的规则列表
        window.MengRulesSave = () => {};           // 保存按钮或函数调用时会用
    } else {
        // 🔹 加载本地/永久规则
        window.MengRules = await window.MengRuleManager.loadRules();
        console.log("[梦晏晨] 永久规则已加载:", window.MengRules);

        // 🔹 保存规则函数
        window.MengRulesSave = (newRules) => {
            console.log("[梦晏晨] 保存规则动作触发，新规则:", newRules);

            // 更新全局内存规则
            window.MengRules = newRules;

            // 保存到本地存储（RuleManager）
            window.MengRuleManager.saveRules(newRules);

            // 刷新 MengCleaner 内部规则缓存，让 cleanText 拿到最新规则
            if (window.MengCleaner?.refreshRules) {
                window.MengCleaner.refreshRules(newRules);
                console.log("[梦晏晨] MengCleaner 规则缓存已刷新 ✅");
            }
        };
    }

    // ===== 异步加载 MengCleaner 模块 =====
    let cleanerPromise = import("./MengCleaner.js")
        .then(m => { 
            window.MengCleaner = m.MengCleaner || m.default;

            // 🔹 初始化 MengCleaner（会加载 RuleManager 的规则）
            return window.MengCleaner.init?.().then(() => {
                console.log("[梦晏晨] MengCleaner 初始化完成，规则已缓存 ✅");
            });
        })
        .catch(e => { console.warn("[梦晏晨] MengCleaner加载失败 ❌", e); });

    // ===== 异步加载 UI 模块 =====
    let uiPromise = import("./ui.js")
        .then(m => { 
            window.MengUI = m; 
            console.log("[梦晏晨] UI 加载完成 ✅"); 
        })
        .catch(e => { console.warn("[梦晏晨] UI加载失败 ❌", e); });

    // ===== 默认规则设置 =====
    const defaultSettings = {
        nameFixRules: [
           {from:"林晟", to:"林晨", enabled:true},
           {from:"林辰", to:"林晨", enabled:true}
        ],
        simpleReplacements: [{ from: "眸子", to: "眼睛", enabled: true }],
        regexRules: [],
        contextRules: []
    };

    let settings = Object.assign({}, defaultSettings, extension_settings[PLUGIN_ID] || {});
    for (const key of Object.keys(settings)) {
        if (!(key in defaultSettings)) delete settings[key]; // 只保留默认设置允许的 key
    }

    // ===== 全局管理 correctNames / pendingConfirmations =====
    window.MengYanChen = window.MengYanChen || {};
    window.MengYanChen.correctNames = window.MengYanChen.correctNames || new Set(['林晨','谢知许','洛君瑾']);
    window.MengYanChen.pendingConfirmations = window.MengYanChen.pendingConfirmations || [];

    // ===== 消息队列 & 处理函数 =====
    window.MengQueue = window.MengQueue || [];

    function enqueueMessage(msg, id) {
        // 🔹 每次有新消息先入队
        window.MengQueue.push({msg, id});
        console.log(`[梦晏晨] 消息已入队 id=${id}`);
    }

    async function processMessage(msg, messageId) {
        if (!window.MengCleaner || !msg || (!msg.mes && !msg.content) || msg._meng_cleaned) return;
        const field = msg.mes ? "mes" : "content";

        requestAnimationFrame(async () => {
            try {
                const cleaned = await window.MengCleaner.cleanText(msg[field], settings);
                if (cleaned !== msg[field]) {
                    msg[field] = cleaned;
                    msg._meng_cleaned = true;

                    // 🔹 更新 SillyTavern 内存中的消息
                    const chat = window.SillyTavern?.getContext?.()?.chat;
                    if (chat?.[messageId]) {
                        chat[messageId][field] = cleaned;
                        chat[messageId]._meng_cleaned = true;
                    }

                    // 🔹 更新页面 DOM 文本
                    const mesBlock = document.querySelector(`#chat .mes[mesid="${messageId}"] .mes_text`);
                    if (mesBlock) mesBlock.textContent = cleaned;

                    console.log(`[梦晏晨] 消息处理完成 id=${messageId} ✅`);
                }
            } catch(err) {
                console.error("[梦晏晨] processMessage 错误 ❌", err);
            }
        });
    }

    // ===== 队列批量处理定时器 =====
    setInterval(async () => {
        if (!window.MengQueue.length) return;
        const batch = window.MengQueue.splice(0, 5); // 每次最多处理 5 条
        for (const {msg, id} of batch) await processMessage(msg, id);
    }, 100);

    await Promise.all([cleanerPromise, uiPromise]);
    console.log("[梦晏晨] 插件初始化完成 ✅");
})();