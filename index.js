(function () {

    const script = document.createElement("script");
script.src = "/scripts/extensions/third-party/meng-yan-chen/cleaner.js";
document.head.appendChild(script);

    const uiScript = document.createElement("script");
uiScript.src = "/scripts/extensions/third-party/meng-yan-chen/ui.js";
document.head.appendChild(uiScript);

    const PLUGIN_ID = "meng-yan-chen";

    const extensions = window.SillyTavern?.extensions || {};
    const extension_settings = extensions.extension_settings || {};
    const saveSettingsDebounced =
        extensions.saveSettingsDebounced || (() => { });

    // ======================
    // 默认设置
    // ======================

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
            "像.{0,10}(?:石头|木头|冰块)",
            "眼神中闪过一丝.{0,15}"
        ]
    };

    let settings =
        extension_settings[PLUGIN_ID] || defaultSettings;

    extension_settings[PLUGIN_ID] = settings;

    // ======================
    // 处理消息
    // ======================

    function processMessage(msg) {

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

    // ======================
    // 初始化
    // ======================

    $(document).ready(() => {

window.MengUI?.injectPandaButton({
    settings,
    extension_settings,
    saveSettingsDebounced,
    PLUGIN_ID
});

        try {

            const eventSource =
                extensions.eventSource;

            const event_types =
                extensions.event_types;

            eventSource?.on(
                event_types.MESSAGE_RECEIVED,
                processMessage
            );

            eventSource?.on(
                event_types.MESSAGE_UPDATED,
                processMessage
            );

        } catch (e) {

            console.error(e);

        }

        console.log(
            "[梦晏晨] 插件已启动"
        );

    });

})();
