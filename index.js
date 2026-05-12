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

        banListSimple: [
            "指尖",
            "深邃",
            "眸子",
            "博弈",
            "石像"
        ],

        banListRegex: [
            "眼神中闪过一丝.{0,15}"
        ],

        contextBanList: [
    "像一头.{0,10}野兽般"
        ],
        
        contextRules: [
    "像.{0,15}(?:野兽|猎物|石头|木头)",
    "眼神中闪过一丝.{0,15}",
        ]
    };

    let settings = Object.assign(
    {},
    defaultSettings,
    extension_settings[PLUGIN_ID] || {}
    );

    extension_settings[PLUGIN_ID] = settings;
    
    function processMessage(msg) {

        console.log(
    "[梦晏晨] processMessage触发",
    msg
);

        if (!window.MengCleaner) return;

        if (!msg?.mes && !msg?.content) return;

        const field = msg.mes ? "mes" : "content";

        const cleaned =
            window.MengCleaner.cleanText(
                msg[field],
                settings
            );

        msg[field] = cleaned;
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

            const msg = args?.[0];

            processMessage(msg);
        }
   );

   context.eventSource.on(
       context.event_types.USER_MESSAGE_RENDERED,
       (...args) => {

           console.log("[梦晏晨] 用户消息事件触发", args);

           const msg = args?.[0];

           processMessage(msg);
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
