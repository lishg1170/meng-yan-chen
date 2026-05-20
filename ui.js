// ======================
// 梦晏晨 UI 面板 (护眼绿色优化版)
// ======================

function openMengPanel(context){
    const {settings,extension_settings,saveSettingsDebounced,PLUGIN_ID} = context;

    if(!Array.isArray(settings.nameFixRules)) settings.nameFixRules = [];
    settings.simpleReplacements = Array.isArray(settings.simpleReplacements)?settings.simpleReplacements:[];
    settings.regexRules = Array.isArray(settings.regexRules)?settings.regexRules:[];
    settings.contextRules = Array.isArray(settings.contextRules)?settings.contextRules:[];

    if($("#meng-overlay").length) return;

    const html = `
<div id="meng-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);">
<div style="width:90%;max-width:520px;max-height:85vh;overflow:auto;background:#1e2b1e;border-radius:18px;padding:18px;color:#d9f6d9;box-shadow:0 0 25px rgba(0,0,0,0.5);">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
<div style="font-size:1.2rem;font-weight:bold;">🐼 梦晏晨 · 文辞净斋</div>
<div id="meng-close" title="关闭" style="cursor:pointer;font-size:1.2rem;transition:color 0.2s;">✕</div>
</div>
<hr style="border-color:#3a5f3a;">

<h3>📛 名字修正</h3>
<div style="display:flex;gap:6px;margin-bottom:4px;">
<input type="text" id="meng-namefix-new-from" placeholder="错误名字" style="flex:1;border-radius:6px;padding:4px;">
<input type="text" id="meng-namefix-new-to" placeholder="正确名字" style="flex:1;border-radius:6px;padding:4px;">
<button id="meng-namefix-add" style="border-radius:6px;padding:4px;background:#10b981;color:white;cursor:pointer;">➕ 添加</button>
</div>
<div id="meng-namefix-container" style="max-height:200px;overflow-y:auto;"></div>

<h3>🗑️ 简单脏词</h3>
<div style="display:flex;gap:6px;margin-bottom:4px;">
<input type="text" id="meng-simple-new-from" placeholder="错误脏词" style="flex:1;border-radius:6px;padding:4px;">
<input type="text" id="meng-simple-new-to" placeholder="正确好词" style="flex:1;border-radius:6px;padding:4px;">
<button id="meng-simple-add" style="border-radius:6px;padding:4px;background:#22c55e;color:white;cursor:pointer;">➕ 添加</button>
</div>
<div id="meng-simple-container" style="max-height:200px;overflow-y:auto;"></div>

<h3>⚙️ 正则清洗 (JSON格式)</h3>
<div style="display:flex;gap:6px;margin-bottom:4px;">
<input type="text" id="meng-regex-new-pattern" placeholder="正则 pattern" style="flex:2;border-radius:6px;padding:4px;">
<input type="text" id="meng-regex-new-replace" placeholder="替换文本" style="flex:1;border-radius:6px;padding:4px;">
<button id="meng-regex-add" style="border-radius:6px;padding:4px;background:#3abfff;color:white;cursor:pointer;">➕ 添加</button>
</div>
<div id="meng-regex-container" style="max-height:200px;overflow-y:auto;"></div>

<h3>✂️ 上下文删除 (JSON格式)</h3>
<div style="display:flex;gap:6px;margin-bottom:4px;">
<input type="text" id="meng-context-new" placeholder="上下文删除内容" style="flex:1;border-radius:6px;padding:4px;">
<button id="meng-context-add" style="border-radius:6px;padding:4px;background:#22c55e;color:white;cursor:pointer;">➕ 添加</button>
</div>
<div id="meng-context-container" style="max-height:200px;overflow-y:auto;"></div>

<h3>📌 待确认新名字</h3>
<div id="pending-confirm-container" style="max-height:120px;overflow-y:auto;background:#123012;padding:6px;border-radius:6px;margin-bottom:12px;"></div>

<h3>🔍 实时预览 & 日志</h3>
<textarea id="meng-preview-input" style="width:100%;height:100px;margin-bottom:6px;border-radius:10px;padding:10px;background:#123012;color:#d9f6d9;border:none;"></textarea>
<div id="meng-preview-output" style="width:100%;min-height:80px;padding:10px;border-radius:10px;background:#101f10;color:#d9f6d9;white-space:pre-wrap;margin-bottom:6px;"></div>
<div id="meng-preview-log" style="width:100%;padding:6px 10px;border-radius:10px;background:#0a1a0a;color:#a0f0a0;white-space:pre-wrap;margin-bottom:12px;"></div>
<div id="meng-live-log" style="width:100%;max-height:100px;overflow-y:auto;background:#0a1a0a;color:#d9f6d9;padding:6px 10px;border-radius:8px;margin-bottom:12px;"></div>

<button id="meng-preview-run" style="width:100%;padding:10px;border:none;border-radius:10px;background:#10b981;color:white;cursor:pointer;margin-bottom:12px;">🔎 预览效果</button>
<div style="display:flex;gap:4%;">
<button id="meng-export" style="flex:1;padding:12px;border:none;border-radius:12px;background:#22c55e;color:white;font-size:1rem;font-weight:bold;cursor:pointer;">📤 导出规则</button>
<button id="meng-import" style="flex:1;padding:12px;border:none;border-radius:12px;background:#3abfff;color:white;font-size:1rem;font-weight:bold;cursor:pointer;">📥 导入规则</button>
</div>
<button id="meng-save" style="width:100%;padding:14px;border:none;border-radius:12px;background:#10b981;color:white;font-size:1rem;font-weight:bold;cursor:pointer;margin-top:12px;">💾 保存设置</button>
<input type="file" id="meng-import-file" accept=".json" style="display:none;">
</div></div>
`;

    $("body").append(html);

    // ===== DOM缓存 =====
    const $previewOutput = $("#meng-preview-output");
    const $previewLog = $("#meng-preview-log");
    const $liveLog = $("#meng-live-log");
    const $pendingConfirm = $("#pending-confirm-container");

    // ===== 关闭按钮 hover效果 =====
    $("#meng-close").off("click").on("click",()=>$("#meng-overlay").remove())
        .hover(()=>$("#meng-close").css("color","#ef4444"),()=>$("#meng-close").css("color","#d9f6d9"));

    // ===== HTML安全转义函数 =====
    function escapeHtml(str = "") {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ===== 渲染列表函数 =====
    function renderToggle(containerId, rules, isSimple=false){
        const container = $(containerId);
        container.empty();
        if(!Array.isArray(rules)) return;

        rules.forEach((item,index)=>{
            if(!item) return;
            if(typeof item==="string") rules[index] = item = {from:item,to:"",enabled:true};

            const text = item.from!==undefined ? `${escapeHtml(item.from)} → ${escapeHtml(item.to||'')}`
                         : item.pattern ? `${escapeHtml(item.pattern)} → ${escapeHtml(item.replace||'(删除)')}`
                         : escapeHtml(JSON.stringify(item));

            const row = $(`
<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;padding:6px;background:#0f2a0f;border-radius:8px;transition:background 0.2s">
<input type="checkbox" ${item.enabled?'checked':''}>
<span style="flex:1;color:${isSimple?'#facc15':'#38bdf8'};word-break:break-all;font-size:0.92rem;">${text}</span>
<button class="meng-delete-rule" style="border:none;background:#ef4444;color:white;border-radius:6px;cursor:pointer;padding:2px 8px;">🗑</button>
</div>
`);

            // hover效果
            row.hover(
                ()=>row.css("background","#1a3a1a"),
                ()=>row.css("background","#0f2a0f")
            );

            // 开关切换
            row.find('input[type=checkbox]').on('change', function(){
                item.enabled = this.checked;
                saveSettingsDebounced();
            });

            // 删除按钮
            row.find('.meng-delete-rule').on('click',()=>{
                rules.splice(index,1);
                renderToggle(containerId,rules,isSimple);
                saveSettingsDebounced();
            });

            container.append(row);
        });
    }

    // ===== 手动添加功能 =====
    $("#meng-namefix-add").off("click").on("click",()=>{
        const from=$("#meng-namefix-new-from").val().trim();
        const to=$("#meng-namefix-new-to").val().trim();
        if(!from||!to) return alert("请填写错误名字和正确名字");

        settings.nameFixRules.push({from,to,enabled:true,desc:"手动添加"});
        renderToggle("#meng-namefix-container",settings.nameFixRules);
        saveSettingsDebounced();
        $("#meng-namefix-new-from,#meng-namefix-new-to").val('');
    });

    $("#meng-simple-add").off("click").on("click",()=>{
        const from=$("#meng-simple-new-from").val().trim();
        const to=$("#meng-simple-new-to").val().trim();
        if(!from) return alert("请填写要替换的原词");
        settings.simpleReplacements.push({from,to,enabled:true});
        renderToggle("#meng-simple-container",settings.simpleReplacements,true);
        saveSettingsDebounced();
        $("#meng-simple-new-from,#meng-simple-new-to").val('');
    });

    $("#meng-regex-add").off("click").on("click",()=>{
        const pattern=$("#meng-regex-new-pattern").val().trim();
        const replace=$("#meng-regex-new-replace").val().trim();
        if(!pattern) return alert("请填写正则 pattern");
        settings.regexRules.push({pattern,replace,enabled:true});
        renderToggle("#meng-regex-container",settings.regexRules);
        saveSettingsDebounced();
        $("#meng-regex-new-pattern,#meng-regex-new-replace").val('');
    });

    $("#meng-context-add").off("click").on("click",()=>{
        const val=$("#meng-context-new").val().trim();
        if(!val) return alert("请填写上下文删除内容");
        settings.contextRules.push({pattern:val,enabled:true});
        renderToggle("#meng-context-container",settings.contextRules);
        saveSettingsDebounced();
        $("#meng-context-new").val('');
    });

    // ===== 初始化列表 =====
    renderToggle("#meng-namefix-container",settings.nameFixRules);
    renderToggle("#meng-simple-container",settings.simpleReplacements,true);
    renderToggle("#meng-regex-container",settings.regexRules);
    renderToggle("#meng-context-container",settings.contextRules);
    
        // ===== 保存设置 =====
    $("#meng-save").off("click").on("click",()=>{
        try {
            extension_settings[PLUGIN_ID] = structuredClone(settings);
            saveSettingsDebounced();
            alert("💾 梦晏晨设置已保存并持久化");
        } catch(e) {
            console.error(e);
            alert("⚠️ 保存失败");
        }
    });

    // ===== 实时预览 & 日志 =====
    $("#meng-preview-run").off("click").on("click",async ()=>{
        const input = $("#meng-preview-input").val() || "";

        // ⚠️ 检查全局状态
        window.MengYanChen = window.MengYanChen || {};
        window.MengYanChen.correctNames = window.MengYanChen.correctNames || new Set();
        window.MengYanChen.pendingConfirmations = window.MengYanChen.pendingConfirmations || [];

        let cleanedText = "";
        try {
            if(!window.MengCleaner || typeof window.MengCleaner.cleanText !== 'function') {
                return alert("⚠️ MengCleaner 未就绪");
            }
            cleanedText = await window.MengCleaner.cleanText(input,settings);
        } catch(err){
            console.error("[梦晏晨] 清洗失败",err);
            return alert("⚠️ 清洗执行失败");
        }

        // 待确认新名字显示
        $pendingConfirm.empty();
        window.MengYanChen.pendingConfirmations.forEach(i=>{
            const row=$(`
                <div>
                    ${escapeHtml(i.wrong)} → ${escapeHtml(i.correct)}
                    <button style="margin-left:8px;">确认</button>
                </div>
            `);
            row.find("button").on("click",()=>{
                window.MengYanChen.correctNames.add(i.correct);
                const idx = window.MengYanChen.pendingConfirmations.indexOf(i);
                if(idx>-1) window.MengYanChen.pendingConfirmations.splice(idx,1);
                row.remove();
            });
            $pendingConfirm.append(row);
        });

        // 输出与日志
        $previewOutput.text(cleanedText);
        $previewLog.html(`
            📝 本轮清洗日志：
            <span style="color:#38bdf8;">名字修正 ${(settings.nameFixRules||[]).length}</span>，
            <span style="color:#facc15;">脏词 ${settings.simpleReplacements.length}</span>，
            <span style="color:#3b82f6;">正则 ${settings.regexRules.length}</span>，
            <span style="color:#f87171;">上下文删除 ${settings.contextRules.length}</span>
        `);
        $liveLog.append(`🕒 [${new Date().toLocaleTimeString()}] 🔍 本轮预览完成\n`);
        $liveLog.scrollTop($liveLog[0].scrollHeight);
    });

    // ===== 导出规则 =====
    $("#meng-export").off("click").on("click",()=>{
        const json=JSON.stringify(settings,null,2);
        const blob=new Blob([json],{type:'application/json'});
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a');
        a.href=url;
        a.download=`梦晏晨-规则备份-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
        alert("📂 规则已导出，可以备份或导入其他设备");
    });

    // ===== 导入规则 =====
    $("#meng-import").off("click").on("click",()=>$("#meng-import-file").click());

    $("#meng-import-file").off("change").on("change",e=>{
        const file=e.target.files?.[0];
        if(!file) return;
        const reader=new FileReader();
        reader.onload=()=>{
            try {
                const imported=JSON.parse(reader.result);
                settings.nameFixRules=Array.isArray(imported.nameFixRules)?imported.nameFixRules.map(i=>({enabled:true,...i})):settings.nameFixRules;
                settings.simpleReplacements=Array.isArray(imported.simpleReplacements)?imported.simpleReplacements.map(i=>({enabled:true,...i})):settings.simpleReplacements;
                settings.regexRules=Array.isArray(imported.regexRules)?imported.regexRules.map(i=>({enabled:true,...i})):settings.regexRules;
                settings.regexRules.forEach(rule=>{
                    try{ rule._regex=new RegExp(rule.pattern,rule.flags||"g"); }
                    catch(err){ console.warn("[梦晏晨] 导入后regex编译失败:",rule.pattern); }
                });
                settings.contextRules=Array.isArray(imported.contextRules)?imported.contextRules.map(i=>({enabled:true,...i})):settings.contextRules;
                extension_settings[PLUGIN_ID]=JSON.parse(JSON.stringify(settings));
                saveSettingsDebounced();
                renderToggle("#meng-namefix-container",settings.nameFixRules);
                renderToggle("#meng-simple-container",settings.simpleReplacements,true);
                renderToggle("#meng-regex-container",settings.regexRules);
                renderToggle("#meng-context-container",settings.contextRules);
                alert("📥 导入成功！");
            } catch(err){
                console.error("[梦晏晨] 导入失败:",err);
                alert("⚠️ 文件格式错误");
            }
        };
        reader.readAsText(file);
        e.target.value="";
    });
}

// ===== 注入 Panda 按钮 =====
function injectPandaButton(context) {
    const target = $("#data_bank_wand_container");
    if (!target.length) {
        // 容错，等容器加载完再注入
        setTimeout(() => injectPandaButton(context), 500);
        return;
    }

    if ($("#meng-panda-btn").length) return; // 已经存在就不重复注入

    const btn = $(`
<div id="meng-panda-btn" style="
    cursor:pointer;
    padding:6px 10px;
    border-radius:12px;
    background:rgba(200,255,200,0.15);
    display:flex;
    align-items:center;
    gap:6px;
    font-size:1rem;
    margin-top:4px;
">
    <span>🐼</span><span>梦晏晨</span>
</div>
`);

    btn.off("click").on("click", () => {
        if (typeof openMengPanel === "function") openMengPanel(context);
        console.log("[梦晏晨] 🐼 Panda 按钮点击，UI已打开");
    });

    target.append(btn);
    console.log("[梦晏晨] 🐼 Panda 按钮注入成功");
}

// ===== 暴露 API 给 index 或其他文件调用 =====
export { 
    openMengPanel,      // 打开完整规则 UI
    injectPandaButton   // 注入 Panda 按钮到页面
};