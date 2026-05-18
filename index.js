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
            pattern: "[^，。！？、；]{0,6}深邃[的地得][^，。！？、；]{0,10}",
            replace: ""
        },

        {
            pattern: "(忽然，?|突然，?|猛地，?|缓缓，?|悄然，?)?[^，。！？、；]{0,2}眼神中闪过一丝[^，。！？、；]{0,12}",
            replace: "垂眸片刻"
        },

        {
            pattern: "像[^，。！？、；]{0,12}野兽般[^，。！？]{0,12}",
            replace: "喉结滚动，轻叹一声"
        },

        {
            pattern: "(露出|带着|用)[^，。！？、；]{0,6}审视猎物般的[^，。！？、；]{0,18}",
            replace: "眼神上下扫视，微拢的手掌内，手指缓缓敲着掌心"
        },

        {
            pattern: "(眼底|眼里|眼中|眼眸中)[^，。！？、；]{0,6}毫不掩饰的[^，。！？、；]{0,10}占有欲",
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
