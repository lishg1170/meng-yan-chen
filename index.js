(async () => {
    console.log("梦晏晨插件加载成功");
    alert("梦晏晨已启动");

    // 1️⃣ 异步导入模块
    const cleanerModule = await import("./cleaner.js");
    const uiModule = await import("./ui.js");

    // 全局挂载
    window.MengCleaner = cleanerModule.MengCleaner;
    window.MengUI = uiModule;

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
            {
                "pattern": "[^，。！？；：:]{0,12}(野兽|幼兽|兽|猎物|猎人|毒蛇|困兽|小兽|公狗|母狗|猫|小猫|狼)[^，。！？；]{0,12}(一样|似的|般|一般)",
                "replace": "",
                "enabled": true
            },
            {
                "pattern": "(好像|像|仿佛|宛若|如同|好似|犹如|像是)[^，。！？；：:\\n]{0,18}(一样|一般|般|似的)",
                "replace": "",
                "enabled": true
            },
            {
                "pattern": "(投进|坠入|落入|沉入|陷入|跌进|没入|溺入|沉溺于|淹没在)[^，。！？；：:\\n]{0,18}(湖|水面|海面|海里|心湖|深井|漩涡|深渊|泥潭|浪潮|潮水|海浪|暗流|洪流|水波|池水|潭水|湖泊|湖心|汪洋|abyss|abyssal)",
                "replace": "",
                "enabled": true
            },
            {
                "pattern": "[^，。！？；]{0,8}(瓷娃娃|洋娃娃|木偶|提线木偶|玩偶|玩具|工具|容器|器具|所有物|收藏品|傀儡)[^，。！？；]{0,12}(一样|似的|般|一般)",
                "replace": "",
                "enabled": true
            },
            {
                "pattern": "(吞没|裹挟|席卷|翻涌|蔓延)[^，。！？；：:\\n]{0,15}(情绪|意识|理智|海浪|浪潮|潮水|暗流)",
                "replace": "",
                "enabled": true
            },
            {
                "pattern": "[^，。！？；]{0,6}深邃[的地得][^，。！？；]{0,10}",
                "replace": "",
                "enabled": true
            },
            {
                "pattern": "(忽然，?|突然，?|猛地，?|缓缓，?|悄然，?)?[^，。！？；]{0,2}眼神中闪过一丝[^，。！？、；]{0,12}",
                "replace": "垂眸片刻",
                "enabled": true
            },
            {
                "pattern": "(露出|带着|用)[^，。！？；]{0,6}审视猎物般的[^，。！？；]{0,18}",
                "replace": "眼神上下扫视，微拢的手掌内，手指缓缓敲着掌心",
                "enabled": true
            },
            {
                "pattern": "(眼底|眼里|眼中|眼眸中)[^，。！？；]{0,6}毫不掩饰的[^，。！？；]{0,10}占有欲",
                "replace": "垂下眼帘，喉结滚动，放在身侧的手缓缓收紧",
                "enabled": true
            }
        ],
        contextRules: [] // === 优化提示 ===: 确保 contextRules 存在，方便后续 cleanText 调用
    };

    // 合并用户设置
    let settings = Object.assign({}, defaultSettings, extension_settings[PLUGIN_ID] || {});

    // 预编译正则（cleaner.js 内也会编译，这里可选）
    settings.regexRules.forEach(rule => {
        if (!rule._regex) rule._regex = new RegExp(rule.pattern, rule.flags || "g");
    });

    extension_settings[PLUGIN_ID] = settings;

    // === 优化提示 === 全局统一管理 pendingConfirmations 和 correctNames
    window.MengYanChen = {
        correctNames: new Set(['林晨','谢知许','洛君瑾']),
        pendingConfirmations: []
    };

    // ===== 消息处理函数 =====
    function processMessage(msg, messageId) {
        console.log("[梦晏晨] processMessage触发", msg);

        if (!window.MengCleaner) return;
        if (!msg?.mes && !msg?.content) return;
        if (msg._meng_cleaned) return;

        const field = msg.mes ? "mes" : "content";
        let cleaned = msg[field];

        // === 已优化原问题 === regexRules 在 index.js 和 cleaner.js 都处理，可能重复
        // === 优化代码 === 这里直接调用 cleanText，统一处理所有规则
        cleaned = window.MengCleaner.cleanText(cleaned, settings);

        if (cleaned !== msg[field]) {
            msg[field] = cleaned;
            msg._meng_cleaned = true;

            // 更新内存消息
            const chat = window.SillyTavern?.getContext?.()?.chat;
            if (chat?.[messageId]) {
                chat[messageId][field] = cleaned;
                chat[messageId]._meng_cleaned = true;
            }

            // 更新 DOM
            const mesBlock = document.querySelector(`#chat .mes[mesid="${messageId}"] .mes_text`);
            if (mesBlock) {
                mesBlock.textContent = cleaned;
                console.log("[梦晏晨] DOM已更新");
            }
        }
    }

    // === 优化提示 === 暴露 processMessage 给 UI.js 调用
    window.MengUI.processMessageWithLearning = (msg, id, settings) => processMessage(msg, id, settings);

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
    // === 优化提示 === 使用轮询绑定，确保 eventSource 就绪
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

    $(document).ready(() => {
        console.log("[梦晏晨] 插件已启动");
        tryInjectPanda();
        bindEvents();
    });

})();