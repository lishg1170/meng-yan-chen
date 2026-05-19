// ======================
// 梦晏晨 UI整合版
// ======================

function openMengPanel(context) {
    const { settings, extension_settings, saveSettingsDebounced, PLUGIN_ID } = context;

    console.log("🐼 梦晏晨 UI 加载");

    // 防止重复打开
    if ($("#meng-overlay").length) return;

    // HTML主体
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

<h3>⚙️ 正则清洗 (JSON格式)</h3>

<textarea
id="meng-regex"
style="
width:100%;
height:200px;
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

    // 初始化文本框
    $("#meng-namefix").val(
        Object.entries(settings.nameFixMap || {})
            .map(([k, v]) => `${k}=${v}`)
            .join("\n")
    );

    $("#meng-simple").val(
        (settings.simpleReplacements || [])
            .map(i => `${i.from}=>${i.to}`)
            .join("\n")
    );

    $("#meng-regex").val(JSON.stringify(settings.regexRules || [], null, 2));

    // 关闭按钮
    $("#meng-close").off("click").on("click", () => $("#meng-overlay").remove());

    // 保存按钮
    $("#meng-save").off("click").on("click", () => {
        // 名字修正
        const nameFixArr = ($("#meng-namefix").val() || "").split("\n").map(line => {
            const parts = line.split("=");
            return { from: parts[0]?.trim(), to: parts[1]?.trim() };
        }).filter(i => i.from && i.to);
        settings.nameFixMap = Object.fromEntries(nameFixArr.map(i => [i.from, i.to]));

        // 简单替换
        const simpleArr = ($("#meng-simple").val() || "").split("\n").map(line => {
            const parts = line.split("=>");
            return { from: parts[0]?.trim(), to: parts[1]?.trim() };
        }).filter(i => i.from && i.to);
        settings.simpleReplacements = simpleArr;

        // 正则 - JSON解析
        try {
            const regexArr = JSON.parse($("#meng-regex").val() || "[]");
            // 校验正则合法性
            regexArr.forEach(item => {
                try { new RegExp(item.pattern); } catch (e) { console.warn("正则有误:", item.pattern); }
            });
            settings.regexRules = regexArr;
        } catch (e) {
            alert("⚠️ 正则 JSON 格式错误！");
            return;
        }

        saveSettingsDebounced();
        alert("✧ 梦晏晨设置已保存");
    });
}

// ======================
// 注入按钮
// ======================

function injectPandaButton(context) {
    const target = $("#data_bank_wand_container");
    if (!target.length) { setTimeout(() => injectPandaButton(context), 1000); return; }
    if ($("#meng-panda-btn").length) return;

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

    btn.on("click", () => openMengPanel(context));
    target.append(btn);

    console.log("[梦晏晨] 🐼 已成功注入");
}

// ======================
// 暴露 API
// ======================

window.MengUI = { openMengPanel, injectPandaButton };