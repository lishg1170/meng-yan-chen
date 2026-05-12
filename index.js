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
    // 创建真正弹窗
    // ======================

    function openMengPanel() {

        // 防止重复打开
        if ($("#meng-overlay").length) return;

        const html = `
<div id="meng-overlay"
style="
position:fixed;
top:0;
left:0;
width:100%;
height:100%;
background:rgba(0,0,0,0.65);
z-index:999999;
display:flex;
align-items:center;
justify-content:center;
backdrop-filter:blur(6px);
">

<div
style="
width:90%;
max-width:520px;
max-height:85vh;
overflow:auto;
background:#1e1e1e;
border-radius:18px;
padding:18px;
color:white;
box-shadow:0 0 25px rgba(0,0,0,0.5);
">

<div style="
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:12px;
">

<div style="
font-size:1.2rem;
font-weight:bold;
">
🐼 梦晏晨 · 文辞净斋
</div>

<div id="meng-close"
style="
cursor:pointer;
font-size:1.2rem;
">
✕
</div>

</div>

<hr>

<h3>📛 名字修正</h3>

<textarea
id="meng-namefix"
style="
width:100%;
height:120px;
margin-bottom:12px;
border-radius:10px;
padding:10px;
background:#2b2b2b;
color:white;
border:none;
">${Object.entries(settings.nameFixMap)
.map(([a,b])=>`${a}=${b}`)
.join("\n")}</textarea>

<h3>🗑️ 简单脏词</h3>

<textarea
id="meng-simple"
style="
width:100%;
height:120px;
margin-bottom:12px;
border-radius:10px;
padding:10px;
background:#2b2b2b;
color:white;
border:none;
">${settings.banListSimple.join("\n")}</textarea>

<h3>⚙️ 正则清洗</h3>

<textarea
id="meng-regex"
style="
width:100%;
height:120px;
margin-bottom:18px;
border-radius:10px;
padding:10px;
background:#2b2b2b;
color:white;
border:none;
">${settings.banListRegex.join("\n")}</textarea>

<button
id="meng-save"
style="
width:100%;
padding:14px;
border:none;
border-radius:12px;
background:#8b5cf6;
color:white;
font-size:1rem;
font-weight:bold;
cursor:pointer;
">
💾 保存设置
</button>

</div>
</div>
`;

        $("body").append(html);

        // 关闭
        $("#meng-close").on("click", () => {
            $("#meng-overlay").remove();
        });

        // 保存
        $("#meng-save").on("click", () => {

            // 名字修正
            const map = {};

            $("#meng-namefix")
                .val()
                .split("\n")
                .forEach(line => {

                    const parts = line.split("=");

                    if (parts.length >= 2) {

                        map[
                            parts[0].trim()
                        ] = parts[1].trim();

                    }

                });

            settings.nameFixMap = map;

            // 简单脏词
            settings.banListSimple =
                $("#meng-simple")
                    .val()
                    .split("\n")
                    .map(v => v.trim())
                    .filter(Boolean);

            // 正则
            settings.banListRegex =
                $("#meng-regex")
                    .val()
                    .split("\n")
                    .map(v => v.trim())
                    .filter(Boolean);

            extension_settings[PLUGIN_ID] =
                settings;

            saveSettingsDebounced();

            alert("✧ 梦晏晨设置已保存");
        });

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
