function openMengPanel(context) {

    console.log("梦晏晨 UI VERSION = 777");

    const {
        settings,
        extension_settings,
        saveSettingsDebounced,
        PLUGIN_ID
    } = context;

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
"></textarea>

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
"></textarea>

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
"></textarea>

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

    $("#meng-namefix").val(
    Object.entries(settings.nameFixMap || {})
        .map(([k, v]) => `${k}=${v}`)
        .join("\n")
);

$("#meng-simple").val(
    (settings.simpleReplacements || [])
        .map(item => `${item.from}=>${item.to}`)
        .join("\n")
);

$("#meng-regex").val(
    (settings.regexRules || [])
        .map(item => `${item.pattern}=>${item.replace}`)
        .join("\n")
);

    // 关闭
    $("#meng-close").off("click").on("click", () => {
    $("#meng-overlay").remove();
});

$("#meng-save").off("click").on("click", () => {

    // 名字修正
    const nameFixArr = ($("#meng-namefix").val() || "")
        .split("\n")
        .map(line => {
            const parts = line.split("=");
            return { from: parts[0]?.trim() || "", to: parts[1]?.trim() || "" };
        })
        .filter(item => item.from && item.to);

    settings.nameFixMap = {};
    nameFixArr.forEach(item => settings.nameFixMap[item.from] = item.to);
    $("#meng-namefix").val(nameFixArr.map(item => `${item.from}=${item.to}`).join("\n"));

    // 简单替换
    const simpleArr = ($("#meng-simple").val() || "")
        .split("\n")
        .map(line => {
            const parts = line.split("=>");
            return { from: parts[0]?.trim() || "", to: parts[1]?.trim() || "" };
        })
        .filter(item => item.from && item.to);

    settings.simpleReplacements = simpleArr;
    $("#meng-simple").val(simpleArr.map(item => `${item.from}=>${item.to}`).join("\n"));

    // 正则
    const regexArr = ($("#meng-regex").val() || "")
        .split("\n")
        .map(line => {
            const parts = line.split("=>");
            return { pattern: parts[0]?.trim() || "", replace: parts[1]?.trim() || "" };
        })
        .filter(item => item.pattern && item.replace);

    settings.regexRules = regexArr;
    $("#meng-regex").val(regexArr.map(item => `${item.pattern}=>${item.replace}`).join("\n"));

    saveSettingsDebounced();
    alert("✧ 梦晏晨设置已保存");
});
    });
}

// ======================
// 注入按钮
// ======================

function injectPandaButton(context) {

    const target =
        $("#data_bank_wand_container");

    if (!target.length) {

        setTimeout(
            () => injectPandaButton(context),
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

    btn.on("click", () => {

        try {

            openMengPanel(context);

        } catch(err) {

            console.error(
                "[梦晏晨] UI打开失败",
                err
            );

        }

    });

    target.append(btn);

    console.log(
        "[梦晏晨] 🐼 已成功注入"
    );
}

// ======================
// 暴露 API
// ======================

window.MengUI = {
    openMengPanel,
    injectPandaButton
};
