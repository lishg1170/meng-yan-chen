(function () {

    const script = document.createElement("script");
script.src = "/scripts/extensions/third-party/meng-yan-chen/cleaner.js";
document.head.appendChild(script);

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
    // 注入按钮
    // ======================

    function injectPandaButton() {

        const target =
            $("#data_bank_wand_container");

        if (!target.length) {

            setTimeout(
                injectPandaButton,
                1000
            );

            return;
        }

        if ($("#meng-panda-btn").length)
            return;

        const btn = $(`
<div
id="meng-panda-btn"
style="
cursor:pointer;
padding:6px 10px;
border-radius:12px;
background:rgba(255,255,255,0.08);
display:flex;
align-items:center;
gap:6px;
font-size:1rem;
margin-top:4px;
">
<span>🐼</span>
<span>梦晏晨</span>
</div>
`);

        btn.on("click", openMengPanel);

        target.append(btn);

        console.log(
            "[梦晏晨] 🐼 已成功注入"
        );
    }

    // ======================
    // 初始化
    // ======================

    $(document).ready(() => {

        injectPandaButton();

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
