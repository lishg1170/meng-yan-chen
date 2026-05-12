(async () => {

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
