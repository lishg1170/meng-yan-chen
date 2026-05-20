// ===== UI 文件: MengPanel.js (第1部分) =====

function openMengPanel(context) {
    const { settings, extension_settings, saveSettingsDebounced, PLUGIN_ID } = context;

    // 确保各类规则数组存在
    settings.nameFixRules = Array.isArray(settings.nameFixRules) ? settings.nameFixRules : [];
    settings.simpleReplacements = Array.isArray(settings.simpleReplacements) ? settings.simpleReplacements : [];
    settings.regexRules = Array.isArray(settings.regexRules) ? settings.regexRules : [];
    settings.contextRules = Array.isArray(settings.contextRules) ? settings.contextRules : [];

    if ($("#meng-overlay").length) return; // 已经打开就不重复创建

    const html = `
<div id="meng-overlay" style="
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
    <div style="
        width:90%;
        max-width:520px;
        max-height:85vh;
        overflow:auto;
        background:#e6f4ea;  /* 护眼浅绿色背景 */
        border-radius:18px;
        padding:18px;
        color:#0f172a;
        box-shadow:0 0 25px rgba(0,0,0,0.5);
    ">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div style="font-size:1.2rem;font-weight:bold;">🐼 梦晏晨 · 文辞净斋</div>
            <div id="meng-close" style="cursor:pointer;font-size:1.2rem;">✕</div>
        </div>
        <hr>
        <!-- 名字修正、脏词、正则、上下文、待确认新名字、预览日志区域后续填充 -->
        <div id="meng-content-container"></div>
    </div>
</div>
`;

    $("body").append(html);

    // ===== DOM 缓存 =====
    const $overlay = $("#meng-overlay");
    const $contentContainer = $("#meng-content-container");

    // 关闭按钮
    $("#meng-close").off("click").on("click", () => $overlay.remove());

    // 面板样式过渡
    $overlay.css({ "backdrop-filter": "blur(6px)", "transition": "opacity 0.25s" });
    $overlay.children("div").css({ "transition": "all 0.25s", "box-shadow": "0 8px 25px rgba(0,0,0,0.45)" });

    // 安全转义 HTML
    function escapeHtml(str = "") {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ===== 待续: 列表渲染、添加规则、日志、预览等逻辑 =====
}

// ===== UI 文件: MengPanel.js (第2部分) =====

function renderRuleList(containerId, rules, isSimple = false) {
    const container = $(containerId);
    container.empty();

    if (!Array.isArray(rules)) return;

    rules.forEach((item, index) => {
        if (!item) return;

        if (typeof item === "string") {
            rules[index] = item = { from: item, to: "", enabled: true };
        }

        const text = item.from !== undefined
            ? `${escapeHtml(item.from)} → ${escapeHtml(item.to || '')}`
            : item.pattern
                ? `${escapeHtml(item.pattern)} → ${escapeHtml(item.replace || '(删除)')}`
                : escapeHtml(JSON.stringify(item));

        const row = $(`
        <div style="
            display:flex;
            align-items:center;
            gap:8px;
            margin-bottom:6px;
            padding:6px;
            background:#d9f0e8;  /* 浅绿色风格 */
            border-radius:8px;
        ">
            <input type="checkbox" ${item.enabled ? 'checked' : ''}>
            <span style="
                flex:1;
                color:${isSimple ? '#f59e0b' : '#0f766e'};
                word-break:break-all;
                font-size:0.92rem;
            ">${text}</span>
            <button class="meng-delete-rule" style="
                border:none;
                background:#ef4444;
                color:white;
                border-radius:6px;
                cursor:pointer;
                padding:2px 8px;
            ">🗑</button>
        </div>`);

        // 切换启用状态
        row.find('input[type=checkbox]').on('change', function () {
            item.enabled = this.checked;
            saveSettingsDebounced();
        });

        // 删除
        row.find('.meng-delete-rule').on('click', () => {
            rules.splice(index, 1);
            renderRuleList(containerId, rules, isSimple);
            saveSettingsDebounced();
        });

        container.append(row);
    });
}

// ===== 手动添加功能 =====
$("#meng-namefix-add").off("click").on("click", () => {
    const from = $("#meng-namefix-new-from").val().trim();
    const to = $("#meng-namefix-new-to").val().trim();
    if (!from || !to) return alert("请填写错误名字和正确名字");

    settings.nameFixRules.push({ from, to, enabled: true, desc: '手动添加' });
    renderRuleList("#meng-namefix-container", settings.nameFixRules);
    saveSettingsDebounced();
    $("#meng-namefix-new-from,#meng-namefix-new-to").val('');
});

$("#meng-simple-add").off("click").on("click", () => {
    const from = $("#meng-simple-new-from").val().trim();
    const to = $("#meng-simple-new-to").val().trim();
    if (!from) return alert("请填写要替换的原词");

    settings.simpleReplacements.push({ from, to, enabled: true });
    renderRuleList("#meng-simple-container", settings.simpleReplacements, true);
    saveSettingsDebounced();
    $("#meng-simple-new-from,#meng-simple-new-to").val('');
});

$("#meng-regex-add").off("click").on("click", () => {
    const pattern = $("#meng-regex-new-pattern").val().trim();
    const replace = $("#meng-regex-new-replace").val().trim();
    if (!pattern) return alert("请填写正则 pattern");

    settings.regexRules.push({ pattern, replace, enabled: true });
    renderRuleList("#meng-regex-container", settings.regexRules);
    saveSettingsDebounced();
    $("#meng-regex-new-pattern,#meng-regex-new-replace").val('');
});

$("#meng-context-add").off("click").on("click", () => {
    const val = $("#meng-context-new").val().trim();
    if (!val) return alert("请填写上下文删除内容");

    settings.contextRules.push({ pattern: val, enabled: true });
    renderRuleList("#meng-context-container", settings.contextRules);
    saveSettingsDebounced();
    $("#meng-context-new").val('');
});

// ===== 初始化渲染 =====
renderRuleList("#meng-namefix-container", settings.nameFixRules);
renderRuleList("#meng-simple-container", settings.simpleReplacements, true);
renderRuleList("#meng-regex-container", settings.regexRules);
renderRuleList("#meng-context-container", settings.contextRules);

// ===== UI 文件: MengPanel.js (第3部分) =====

// ===== 预览功能 =====
$("#meng-preview-run").off("click").on("click", () => {
    const input = $("#meng-preview-input").val() || "";
    $previewOutput.text("正在清洗...");
    $previewLog.text("正在生成日志...");

    if (!window.MengYanChen) window.MengYanChen = {};
    if (!window.MengYanChen.pendingConfirmations) window.MengYanChen.pendingConfirmations = [];
    if (!window.MengYanChen.correctNames) window.MengYanChen.correctNames = new Set();

    async function runPreview() {
        if (!window.MengCleaner || typeof window.MengCleaner.cleanText !== 'function') {
            alert("⚠️ MengCleaner 未就绪，请稍后重试");
            return;
        }

        let cleanedText = "";
        try {
            cleanedText = await window.MengCleaner.cleanText(input, settings);
        } catch (err) {
            console.error("[梦晏晨] 清洗失败", err);
            alert("⚠️ 清洗执行失败");
            return;
        }

        // 待确认新名字显示
        $pendingConfirm.empty();
        window.MengYanChen.pendingConfirmations.forEach(item => {
            const row = $(`
                <div style="margin-bottom:4px;">
                    ${escapeHtml(item.wrong)} → ${escapeHtml(item.correct)}
                    <button style="margin-left:8px;">确认</button>
                </div>
            `);
            row.find("button").on("click", () => {
                window.MengYanChen.correctNames.add(item.correct);
                window.MengYanChen.pendingConfirmations.splice(
                    window.MengYanChen.pendingConfirmations.indexOf(item), 1
                );
                row.remove();
            });
            $pendingConfirm.append(row);
        });

        // 日志显示
        $previewOutput.text(cleanedText);
        $previewLog.html(`
            📝 本轮清洗日志：
            <span style="color:#0f766e;">名字修正 ${(settings.nameFixRules || []).length}</span>，
            <span style="color:#f59e0b;">脏词 ${settings.simpleReplacements.length}</span>，
            <span style="color:#3b82f6;">正则 ${settings.regexRules.length}</span>，
            <span style="color:#f87171;">上下文删除 ${settings.contextRules.length}</span>
        `);
        $liveLog.append(`🕒 [${new Date().toLocaleTimeString()}] 🔍 本轮预览完成\n`);
        $liveLog.scrollTop($liveLog[0].scrollHeight);
    }

    runPreview();
});

// ===== 保存设置按钮 =====
$("#meng-save").off("click").on("click", () => {
    try {
        extension_settings[PLUGIN_ID] = structuredClone(settings);
        saveSettingsDebounced();
        alert("💾 梦晏晨设置已保存");
        $liveLog.append(`🕒 [${new Date().toLocaleTimeString()}] 💾 设置已保存\n`);
        $liveLog.scrollTop($liveLog[0].scrollHeight);
    } catch (err) {
        console.error(err);
        alert("⚠️ 保存失败");
    }
});

// ===== 导出规则 =====
$("#meng-export").off("click").on("click", () => {
    const json = JSON.stringify(settings, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);

    a.href = url;
    a.download = `梦晏晨-规则备份-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    alert("📂 规则已导出");
});

// ===== 导入规则 =====
$("#meng-import").off("click").on("click", () => {
    $("#meng-import-file").click();
});

$("#meng-import-file").off("change").on("change", e => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        try {
            const imported = JSON.parse(reader.result);
            if (typeof imported !== "object" || imported === null) throw new Error("无效配置");

            // 赋值并保证 enabled 默认 true
            settings.nameFixRules = (Array.isArray(imported.nameFixRules) ? imported.nameFixRules : []).map(i => ({ enabled:true, ...i }));
            settings.simpleReplacements = (Array.isArray(imported.simpleReplacements) ? imported.simpleReplacements : []).map(i => ({ enabled:true, ...i }));
            settings.regexRules = (Array.isArray(imported.regexRules) ? imported.regexRules : []).map(i => ({ enabled:true, ...i }));
            settings.contextRules = (Array.isArray(imported.contextRules) ? imported.contextRules : []).map(i => ({ enabled:true, ...i }));

            // 编译正则
            settings.regexRules.forEach(rule => {
                try { rule._regex = new RegExp(rule.pattern, rule.flags || "g"); } 
                catch(err) { console.warn("[梦晏晨] 导入后 regex 编译失败:", rule.pattern); }
            });

            extension_settings[PLUGIN_ID] = JSON.parse(JSON.stringify(settings));
            saveSettingsDebounced();

            // 重新渲染
            renderRuleList("#meng-namefix-container", settings.nameFixRules);
            renderRuleList("#meng-simple-container", settings.simpleReplacements, true);
            renderRuleList("#meng-regex-container", settings.regexRules);
            renderRuleList("#meng-context-container", settings.contextRules);

            alert("📥 导入成功！");
        } catch (err) {
            console.error("[梦晏晨] 导入失败:", err);
            alert("⚠️ 文件格式错误");
        }
    };
    reader.readAsText(file);
    e.target.value = ""; // 重置 input
});

// ===== UI 文件: MengPanel.js (第4部分) =====

// ===== 熊猫按钮注入 =====
function injectPandaButton(context) {
    const target = $("#data_bank_wand_container"); // 目标挂载容器
    if (!target.length) { 
        // 延迟重试
        setTimeout(() => injectPandaButton(context), 500); 
        return; 
    }

    if ($("#meng-panda-btn").length) return; // 已经注入过就不再重复

    const btn = $(`
        <div id="meng-panda-btn" style="
            cursor:pointer;
            padding:6px 10px;
            border-radius:12px;
            background:rgba(0, 128, 0, 0.15); /* 浅绿色护眼 */
            display:flex;
            align-items:center;
            gap:6px;
            font-size:1rem;
            margin-top:4px;
            user-select:none;
            transition: background 0.25s;
        ">
            <span>🐼</span><span>梦晏晨</span>
        </div>
    `);

    btn.hover(
        () => btn.css("background", "rgba(0, 128, 0, 0.25)"),
        () => btn.css("background", "rgba(0, 128, 0, 0.15)")
    );

    btn.on("click", () => {
        openMengPanel(context);
    });

    target.append(btn);
    console.log("[梦晏晨] 🐼 Panda 按钮注入成功");
}

// ===== 安全挂载全局 API =====
window.MengUI = window.MengUI || {};
window.MengUI.openMengPanel = window.MengUI.openMengPanel || openMengPanel;
window.MengUI.injectPandaButton = window.MengUI.injectPandaButton || injectPandaButton;

// ===== 页面就绪时自动注入按钮 =====
$(document).ready(() => {
    const context = window.SillyTavern?.getContext?.() || {};
    window.MengUI.injectPandaButton(context);
});

// ===== UI 日志绑定 =====
function bindRuleManagerUI(context) {
    if (!context) context = window.SillyTavern?.getContext?.();
    if (!context) return setTimeout(() => bindRuleManagerUI(context), 500);

    const $liveLog = $("#meng-live-log");
    if (!$liveLog.length) return setTimeout(() => bindRuleManagerUI(context), 500);

    function appendLiveLog(msg) {
        const time = new Date().toLocaleTimeString();
        $liveLog.append(`🕒 [${time}] ${msg}\n`);
        $liveLog.scrollTop($liveLog[0].scrollHeight);
        console.log("[梦晏晨 RuleManager]", msg);
    }

    // ===== 规则变动日志 =====
    registerUpdateCallback((newRules) => {
        appendLiveLog(`🔄 RuleManager 更新完成，当前规则条数: ${newRules.length}`);
    });

    // ===== 增强 UI 按钮交互 =====
    function renderRuleList(containerId, type) {
        const container = $(containerId);
        if (!container.length) return;
        container.empty();

        const list = getRulesByType(type);
        list.forEach((rule, index) => {
            const row = $(`
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;padding:6px;background:#1a1a1a;border-radius:8px;">
                    <input type="checkbox" ${rule.enabled ? 'checked' : ''}>
                    <span style="flex:1;color:#38bdf8;word-break:break-all;font-size:0.92rem;">
                        ${rule.type==='nameFix' ? `${rule.from} → ${rule.to}` :
                          rule.type==='simple' ? `${rule.from} → ${rule.to}` :
                          rule.type==='regex' ? `${rule.pattern} → ${rule.replace || '(删除)'}` :
                          rule.pattern || JSON.stringify(rule)}
                    </span>
                    <button style="border:none;background:#ef4444;color:white;border-radius:6px;cursor:pointer;padding:2px 8px;">🗑</button>
                </div>
            `);

            // ===== 开关 =====
            row.find("input[type=checkbox]").on("change", function() {
                rule.enabled = this.checked;
                updateRule(rules.indexOf(rule), rule);
                appendLiveLog(`🔔 ${rule.type}规则 ${rule.type==='nameFix'?rule.from:rule.pattern} 状态更新`);
            });

            // ===== 删除 =====
            row.find("button").on("click", () => {
                const idx = rules.indexOf(rule);
                if (idx>=0) {
                    removeRule(idx);
                    row.remove();
                    appendLiveLog(`🗑 已删除 ${rule.type}规则`);
                }
            });

            container.append(row);
        });
    }

    // ===== 提供外部更新接口 =====
    window.MengRuleManager.renderRuleList = renderRuleList;

    appendLiveLog("✅ RuleManager UI 已绑定完成");
}

// ===== 自动尝试绑定 =====
bindRuleManagerUI();

// ===== Panda按钮注入 =====
function injectPandaButton(context){
    const target=$("#data_bank_wand_container");
    if(!target.length){setTimeout(()=>injectPandaButton(context),500); return;}
    if($("#meng-panda-btn").length) return;

    const btn=$(`
<div id="meng-panda-btn" style="
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
    <span>🐼</span><span>梦晏晨</span>
</div>`);

    btn.on("click", () => {
        if(window.MengUI && typeof window.MengUI.openMengPanel === 'function'){
            window.MengUI.openMengPanel(context);
            console.log("[梦晏晨] Panda按钮点击 — UI已打开");
        }
    });

    target.append(btn);
    console.log("[梦晏晨] 🐼 Panda按钮注入完成");
}

// ===== 日志折叠功能 =====
function setupLogToggle(){
    const $liveLog=$("#meng-live-log");
    if(!$liveLog.length){setTimeout(setupLogToggle,500); return;}

    const $logToggleBtn=$(`
        <button id="meng-log-toggle" style="
            position:absolute;
            top:12px;
            right:18px;
            padding:4px 8px;
            font-size:0.9rem;
            border-radius:6px;
            border:none;
            background:#10b981;
            color:white;
            cursor:pointer;
        ">📜 收起日志</button>
    `);

    $("#meng-overlay > div").append($logToggleBtn);

    let visible=true;
    $logToggleBtn.on("click",()=>{
        visible=!visible;
        $liveLog.toggle(visible);
        $logToggleBtn.text(visible ? "📜 收起日志" : "📜 显示日志");
        console.log(`[梦晏晨] 日志已${visible?'显示':'隐藏'}`);
    });
}

// ===== 自动初始化 Panda按钮 & 日志折叠 =====
function initRuleManagerUI(context){
    injectPandaButton(context);
    setupLogToggle();
    if(window.MengUI && typeof window.MengUI.renderRuleList === 'function'){
        window.MengUI.renderRuleList("#meng-namefix-container", "nameFix");
        window.MengUI.renderRuleList("#meng-simple-container", "simple");
        window.MengUI.renderRuleList("#meng-regex-container", "regex");
        window.MengUI.renderRuleList("#meng-context-container", "context");
    }
    console.log("[梦晏晨] RuleManager UI 初始化完成");
}

// ===== 暴露API =====
window.MengRuleManager = window.MengRuleManager || {};
window.MengRuleManager.injectPandaButton = injectPandaButton;
window.MengRuleManager.setupLogToggle = setupLogToggle;
window.MengRuleManager.initRuleManagerUI = initRuleManagerUI;

// ===== 规则工具 =====
function getRuleArrayByType(type){
    switch(type){
        case "nameFix":
            return rules.filter(r=>r.type==="nameFix");

        case "simple":
            return rules.filter(r=>r.type==="simple");

        case "regex":
            return rules.filter(r=>r.type==="regex");

        case "context":
            return rules.filter(r=>r.type==="context");

        default:
            return [];
    }
}

// ===== 保存到本地 =====
async function saveRules(){
    try{
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(rules)
        );

        console.log(
            `[梦晏晨 RuleManager] 💾 规则已保存，共 ${rules.length} 条`
        );

        notifyUpdate();

        return true;

    }catch(err){

        console.error(
            "[梦晏晨 RuleManager] 保存失败",
            err
        );

        return false;
    }
}

// ===== 添加规则 =====
async function addRule(rule){

    if(!rule || typeof rule !== "object"){
        console.warn(
            "[梦晏晨 RuleManager] addRule收到非法规则"
        );
        return false;
    }

    // 默认 enabled
    if(typeof rule.enabled !== "boolean"){
        rule.enabled = true;
    }

    // 默认ID
    if(!rule.id){
        rule.id =
            "meng_" +
            Date.now() +
            "_" +
            Math.random().toString(36).slice(2,8);
    }

    rules.push(rule);

    console.log(
        `[梦晏晨 RuleManager] ➕ 已添加规则:`,
        rule
    );

    await saveRules();

    return true;
}

// ===== 删除规则 =====
async function removeRule(ruleId){

    const oldLength = rules.length;

    rules = rules.filter(r=>r.id !== ruleId);

    if(rules.length === oldLength){

        console.warn(
            `[梦晏晨 RuleManager] ⚠️ 未找到规则ID: ${ruleId}`
        );

        return false;
    }

    console.log(
        `[梦晏晨 RuleManager] 🗑️ 已删除规则 ${ruleId}`
    );

    await saveRules();

    return true;
}

// ===== 更新规则 =====
async function updateRule(ruleId,newData){

    const target = rules.find(r=>r.id===ruleId);

    if(!target){

        console.warn(
            `[梦晏晨 RuleManager] ⚠️ updateRule 未找到 ${ruleId}`
        );

        return false;
    }

    Object.assign(target,newData);

    // regex重新编译
    if(target.type==="regex"){

        try{

            target._regex = new RegExp(
                target.pattern,
                target.flags || "g"
            );

        }catch(err){

            console.warn(
                "[梦晏晨 RuleManager] regex重新编译失败",
                target.pattern
            );
        }
    }

    console.log(
        `[梦晏晨 RuleManager] ✏️ 规则已更新`,
        target
    );

    await saveRules();

    return true;
}

// ===== 开关规则 =====
async function toggleRule(ruleId,enabled){

    const target = rules.find(r=>r.id===ruleId);

    if(!target){

        console.warn(
            `[梦晏晨 RuleManager] toggleRule未找到 ${ruleId}`
        );

        return false;
    }

    target.enabled = !!enabled;

    console.log(
        `[梦晏晨 RuleManager] 🔘 ${
            enabled ? "启用" : "禁用"
        }规则`,
        target
    );

    await saveRules();

    return true;
}

// ===== 清空规则 =====
async function clearRules(type=null){

    if(!type){

        rules = [];

        console.log(
            "[梦晏晨 RuleManager] ⚠️ 已清空全部规则"
        );

    }else{

        rules = rules.filter(r=>r.type !== type);

        console.log(
            `[梦晏晨 RuleManager] ⚠️ 已清空 ${type} 类型规则`
        );
    }

    await saveRules();
}

// ===== 导出规则 =====
function exportRules(){

    try{

        const blob = new Blob(
            [JSON.stringify(rules,null,2)],
            {type:"application/json"}
        );

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;

        a.download =
            `梦晏晨规则备份_${
                new Date().toISOString().slice(0,10)
            }.json`;

        a.click();

        setTimeout(()=>{
            URL.revokeObjectURL(url);
        },1000);

        console.log(
            "[梦晏晨 RuleManager] 📤 规则导出成功"
        );

    }catch(err){

        console.error(
            "[梦晏晨 RuleManager] 导出失败",
            err
        );
    }
}

// ===== 导入规则 =====
async function importRules(json){

    try{

        const imported =
            typeof json === "string"
                ? JSON.parse(json)
                : json;

        if(!Array.isArray(imported)){

            console.warn(
                "[梦晏晨 RuleManager] 导入格式错误"
            );

            return false;
        }

        imported.forEach(rule=>{

            // regex预编译
            if(rule.type==="regex"){

                try{

                    rule._regex = new RegExp(
                        rule.pattern,
                        rule.flags || "g"
                    );

                }catch(err){

                    console.warn(
                        "[梦晏晨 RuleManager] regex导入失败",
                        rule.pattern
                    );
                }
            }

            if(typeof rule.enabled !== "boolean"){
                rule.enabled = true;
            }

            if(!rule.id){
                rule.id =
                    "meng_" +
                    Date.now() +
                    "_" +
                    Math.random().toString(36).slice(2,8);
            }
        });

        rules = imported;

        await saveRules();

        console.log(
            `[梦晏晨 RuleManager] 📥 导入成功，共 ${rules.length} 条`
        );

        return true;

    }catch(err){

        console.error(
            "[梦晏晨 RuleManager] 导入失败",
            err
        );

        return false;
    }
}

// ===== API暴露 =====
window.MengRuleManager.getRuleArrayByType = getRuleArrayByType;
window.MengRuleManager.addRule = addRule;
window.MengRuleManager.removeRule = removeRule;
window.MengRuleManager.updateRule = updateRule;
window.MengRuleManager.toggleRule = toggleRule;
window.MengRuleManager.clearRules = clearRules;
window.MengRuleManager.exportRules = exportRules;
window.MengRuleManager.importRules = importRules;
window.MengRuleManager.saveRules = saveRules;

// ===== 自动同步 UI =====
function syncUI(){

    try{

        if(!window.MengUI){

            console.warn(
                "[梦晏晨 RuleManager] ⚠️ MengUI不存在，跳过UI同步"
            );

            return;
        }

        if(typeof window.MengUI.renderRuleList === "function"){

            window.MengUI.renderRuleList(
                "#meng-namefix-container",
                getRuleArrayByType("nameFix")
            );

            window.MengUI.renderRuleList(
                "#meng-simple-container",
                getRuleArrayByType("simple"),
                true
            );

            window.MengUI.renderRuleList(
                "#meng-regex-container",
                getRuleArrayByType("regex")
            );

            window.MengUI.renderRuleList(
                "#meng-context-container",
                getRuleArrayByType("context")
            );

            console.log(
                "[梦晏晨 RuleManager] 🔄 UI同步完成"
            );
        }

    }catch(err){

        console.error(
            "[梦晏晨 RuleManager] UI同步失败",
            err
        );
    }
}

// ===== 更新通知 =====
function notifyUpdate(){

    console.log(
        "[梦晏晨 RuleManager] 📢 开始广播规则更新"
    );

    syncUI();

    updateCallbacks.forEach(fn=>{

        try{

            fn(rules);

        }catch(err){

            console.error(
                "[梦晏晨 RuleManager] updateCallback执行失败",
                err
            );
        }
    });
}

// ===== 注册监听 =====
function registerUpdateCallback(callback){

    if(typeof callback !== "function"){

        console.warn(
            "[梦晏晨 RuleManager] registerUpdateCallback参数非法"
        );

        return;
    }

    updateCallbacks.push(callback);

    console.log(
        "[梦晏晨 RuleManager] ✅ 已注册更新监听"
    );
}

// ===== 自动恢复 regex =====
function restoreRegexCache(){

    rules.forEach(rule=>{

        if(rule.type !== "regex") return;

        if(rule._regex) return;

        try{

            rule._regex = new RegExp(
                rule.pattern,
                rule.flags || "g"
            );

            console.log(
                `[梦晏晨 RuleManager] ♻️ regex恢复成功: ${rule.pattern}`
            );

        }catch(err){

            console.warn(
                `[梦晏晨 RuleManager] regex恢复失败: ${rule.pattern}`
            );
        }
    });
}

// ===== 自动初始化 =====
async function initializeRuleManager(){

    console.log(
        "[梦晏晨 RuleManager] 🚀 开始初始化..."
    );

    await loadRules();

    restoreRegexCache();

    notifyUpdate();

    console.log(
        `[梦晏晨 RuleManager] ✅ 初始化完成，共 ${rules.length} 条规则`
    );
}

// ===== 页面卸载自动保存 =====
window.addEventListener("beforeunload",()=>{

    try{

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(rules)
        );

        console.log(
            "[梦晏晨 RuleManager] 💾 页面关闭前自动保存成功"
        );

    }catch(err){

        console.error(
            "[梦晏晨 RuleManager] 页面关闭自动保存失败",
            err
        );
    }
});

// ===== 崩溃恢复保护 =====
window.addEventListener("error",(event)=>{

    console.error(
        "[梦晏晨 RuleManager] ❌ 全局错误",
        event.error
    );

    const $liveLog=$("#meng-live-log");

    if($liveLog.length){

        $liveLog.append(
            `🕒 [${new Date().toLocaleTimeString()}] ❌ 检测到错误: ${
                event.message || "未知错误"
            }\n`
        );

        $liveLog.scrollTop(
            $liveLog[0].scrollHeight
        );
    }
});

// ===== Promise错误监听 =====
window.addEventListener(
    "unhandledrejection",
    (event)=>{

        console.error(
            "[梦晏晨 RuleManager] ❌ Promise未捕获错误",
            event.reason
        );

        const $liveLog=$("#meng-live-log");

        if($liveLog.length){

            $liveLog.append(
                `🕒 [${new Date().toLocaleTimeString()}] ❌ Promise错误: ${
                    String(event.reason)
                }\n`
            );

            $liveLog.scrollTop(
                $liveLog[0].scrollHeight
            );
        }
    }
);

// ===== 定时自动保存 =====
setInterval(()=>{

    try{

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(rules)
        );

        console.log(
            "[梦晏晨 RuleManager] ⏱️ 定时自动保存完成"
        );

    }catch(err){

        console.error(
            "[梦晏晨 RuleManager] 定时保存失败",
            err
        );
    }

}, 1000 * 60 * 3); // 每3分钟自动保存

// ===== API暴露 =====
window.MengRuleManager.registerUpdateCallback =
    registerUpdateCallback;

window.MengRuleManager.notifyUpdate =
    notifyUpdate;

window.MengRuleManager.syncUI =
    syncUI;

window.MengRuleManager.initialize =
    initializeRuleManager;

// ===== 自动启动 =====
initializeRuleManager();

console.log(
    "[梦晏晨 RuleManager] 🌸 所有模块已加载完成"
);