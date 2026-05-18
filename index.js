(async () => {

console.log("梦晏晨插件加载成功");
alert("梦晏晨已启动");
    
    await import("./cleaner.js");
    await import("./ui.js");

    const PLUGIN_ID = "meng-yan-chen";

    const extensions = window.SillyTavern?.extensions || {};
    const extension_settings = extensions.extension_settings || {};
    const saveSettingsDebounced =
        extensions.saveSettingsDebounced || (() => { });

    const defaultSettings = {

    nameFixMap: {

        "林晟": "林晨",
        "林辰": "林晨"
    },

    simpleReplacements: [

        {
            from: "眸子",
            to: "眼睛"
        }
    ],

    regexRules: [
        
        {
            pattern: "(指尖|深邃|博弈|精准|优雅|微颤|笼中鸟|缠绵|猎手|雕像|雕塑|评估|羁绊|宿命|升华|暗流涌动|不可名状)",
            replace: ""
        },
        
        {
            pattern: "[^，。！？；：:]{0,12}(野兽|幼兽|兽|猎物|猎人|毒蛇|困兽|小兽|公狗|母狗|猫|小猫|狼)[^，。！？；]{0,12}(一样|似的|般|一般)",
            replace: ""
        },
        
        {
            pattern: "(像|仿佛|宛若|如同|好似|犹如|像是)[^，。！？；：:\n]{0,18}(一样|一般|般|似的)",
            replace: ""
        },
        
        {
            pattern: "(投进|坠入|落入|沉入|陷入|跌进|没入|溺入|沉溺于|淹没在)[^，。！？；：:\\n]{0,18}(湖|水面|海面|海里|心湖|深井|漩涡|深渊|泥潭|浪潮|潮水|海浪|暗流|洪流|水波|池水|潭水|湖泊|湖心|汪洋| abyss | abyssal)",
            replace: ""
        },
        
        {
            pattern: "[^，。！？；]{0,8}(瓷娃娃|洋娃娃|木偶|提线木偶|玩偶|玩具|工具|容器|器具|所有物|收藏品|傀儡)[^，。！？；]{0,12}(一样|似的|般|一般)",
            replace: ""
        },
        
        {
            pattern: "(吞没|裹挟|席卷|翻涌|蔓延)[^，。！？；：:\\n]{0,15}情绪|意识|理智|海浪|浪潮|潮水|暗流)",
            replace: ""
        },
        
        {
            pattern: "[^，。！？；]{0,6}深邃[的地得][^，。！？；]{0,10}",
            replace: ""
        },

        {
            pattern: "(忽然，?|突然，?|猛地，?|缓缓，?|悄然，?)?[^，。！？；]{0,2}眼神中闪过一丝[^，。！？、；]{0,12}",
            replace: "垂眸片刻"
        },

        {
            pattern: "(露出|带着|用)[^，。！？；]{0,6}审视猎物般的[^，。！？；]{0,18}",
            replace: "眼神上下扫视，微拢的手掌内，手指缓缓敲着掌心"
        },

        {
            pattern: "(眼底|眼里|眼中|眼眸中)[^，。！？；]{0,6}毫不掩饰的[^，。！？；]{0,10}占有欲",
            replace: "垂下眼帘，喉结滚动，放在身侧的手缓缓收紧"
        }
    ]
};

    let settings = Object.assign(
    {},
    defaultSettings,
    extension_settings[PLUGIN_ID] || {}
    );

    extension_settings[PLUGIN_ID] = settings;
    
    function processMessage(msg, messageId){

        console.log(
    "[梦晏晨] processMessage触发",
    msg
);

        if (!window.MengCleaner) return;

        if (!msg?.mes && !msg?.content) return;

        // 防止重复清洗

        if (msg._meng_cleaned) return;

        const field = msg.mes ? "mes" : "content";

        const cleaned =
            window.MengCleaner.cleanText(
                msg[field],
                settings
                );

                console.log(
                    "[梦晏晨] 清洗前:",
                    msg[field]
                );

                console.log(
                    "[梦晏晨] settings:",
                    settings
                );

                console.log(
                    "[梦晏晨] 清洗后:",
                    cleaned
                );

        if (cleaned !== msg[field]) {
            console.log(
                "[梦晏晨] 已检测到可清洗内容"
            );

            // 更新内存消息
            msg[field] = cleaned;

            msg._meng_cleaned = true;

            const chat =
                window.SillyTavern
                    ?.getContext?.()
                    ?.chat;

            if (chat?.[messageId]) {

                chat[messageId][field] = cleaned;

                chat[messageId]._meng_cleaned = true;
            }

            // 更新DOM            
            const mesBlock =
                document.querySelector(
                    `#chat .mes[mesid="${messageId}"] .mes_text`
                );

            if (mesBlock) {
                mesBlock.textContent = cleaned;
                console.log(
                    "[梦晏晨] DOM已更新"

                );

            }
        }
    }

    $(document).ready(() => {

        window.MengUI?.injectPandaButton({
            settings,
            extension_settings,
            saveSettingsDebounced,
            PLUGIN_ID
        });

        console.log(
            "[梦晏晨] 插件已启动"
        );

        const context = window.SillyTavern?.getContext?.();

console.log("[梦晏晨] context:", context);

if (context?.eventSource) {
    console.log("[梦晏晨] 开始监听消息");

    context.eventSource.on(
        context.event_types.CHARACTER_MESSAGE_RENDERED,
        (...args) => {

            console.log("[梦晏晨] 角色消息事件触发", args);

            const messageId = Number(args?.[0]);

            const chat =
                window.SillyTavern
                    ?.getContext?.()
                    ?.chat;

            const msg = chat?.[messageId];

            if (!msg) return;

            processMessage(msg, messageId);
        }
   );

   context.eventSource.on(
       context.event_types.USER_MESSAGE_RENDERED,
       (...args) => {

           console.log("[梦晏晨] 用户消息事件触发", args);

           const messageId = Number(args?.[0]);

           const chat =
               window.SillyTavern
                   ?.getContext?.()
                   ?.chat;

           const msg = chat?.[messageId];

           if (!msg) return;

           processMessage(msg, messageId);
        }
   );

    context.eventSource.on(
        context.event_types.CHAT_CHANGED,
        (...args) => {
            console.log("[梦晏晨] 聊天切换事件", args);
        }
    );

} else {
    console.log("[梦晏晨] eventSource不存在");
}
    
    });

})();
