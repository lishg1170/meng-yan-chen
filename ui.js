function openMengPanel(context){
    const {settings,extension_settings,saveSettingsDebounced,PLUGIN_ID} = context;
    
    settings.nameFixMap = settings.nameFixMap || {};
    settings.simpleReplacements = settings.simpleReplacements || [];
    settings.regexRules = settings.regexRules || [];
    settings.contextRules = settings.contextRules || [];
    
    if($("#meng-overlay").length) return;

    const html = `
<div id="meng-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.65);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);">
<div style="width:90%;max-width:520px;max-height:85vh;overflow:auto;background:#1e1e1e;border-radius:18px;padding:18px;color:white;box-shadow:0 0 25px rgba(0,0,0,0.5);">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
<div style="font-size:1.2rem;font-weight:bold;">🐼 梦晏晨 · 文辞净斋</div>
<div id="meng-close" style="cursor:pointer;font-size:1.2rem;">✕</div>
</div>
<hr>

<h3>📛 名字修正</h3>
<div style="display:flex;gap:6px;margin-bottom:4px;">
<input type="text" id="meng-namefix-new-from" placeholder="错误名字" style="flex:1;border-radius:6px;padding:4px;">
<input type="text" id="meng-namefix-new-to" placeholder="正确名字" style="flex:1;border-radius:6px;padding:4px;">
<button id="meng-namefix-add" style="border-radius:6px;padding:4px;background:#8b5cf6;color:white;cursor:pointer;">➕ 添加</button>
</div>
<div id="meng-namefix-container" style="max-height:200px;overflow-y:auto;"></div>

<h3>🗑️ 简单脏词</h3>
<div style="display:flex;gap:6px;margin-bottom:4px;">
<input type="text" id="meng-simple-new" placeholder="新脏词/替换" style="flex:1;border-radius:6px;padding:4px;">
<button id="meng-simple-add" style="border-radius:6px;padding:4px;background:#facc15;color:black;cursor:pointer;">➕ 添加</button>
</div>
<div id="meng-simple-container" style="max-height:200px;overflow-y:auto;"></div>

<h3>⚙️ 正则清洗 (JSON格式)</h3>
<div style="display:flex;gap:6px;margin-bottom:4px;">
<input type="text" id="meng-regex-new-pattern" placeholder="正则 pattern" style="flex:2;border-radius:6px;padding:4px;">
<input type="text" id="meng-regex-new-replace" placeholder="替换文本" style="flex:1;border-radius:6px;padding:4px;">
<button id="meng-regex-add" style="border-radius:6px;padding:4px;background:#3b82f6;color:white;cursor:pointer;">➕ 添加</button>
</div>
<div id="meng-regex-container" style="max-height:200px;overflow-y:auto;"></div>

<h3>✂️ 上下文删除 (JSON格式)</h3>
<div style="display:flex;gap:6px;margin-bottom:4px;">
<input type="text" id="meng-context-new" placeholder="上下文删除内容" style="flex:1;border-radius:6px;padding:4px;">
<button id="meng-context-add" style="border-radius:6px;padding:4px;background:#e879f9;color:white;cursor:pointer;">➕ 添加</button>
</div>
<div id="meng-context-container" style="max-height:200px;overflow-y:auto;"></div>

<h3>📌 待确认新名字</h3>
<div id="pending-confirm-container" style="max-height:120px;overflow-y:auto;background:#111;padding:6px;border-radius:6px;margin-bottom:12px;"></div>

<h3>🔍 实时预览 & 日志</h3>
<textarea id="meng-preview-input" style="width:100%;height:100px;margin-bottom:6px;border-radius:10px;padding:10px;background:#2b2b2b;color:white;border:none;"></textarea>
<div id="meng-preview-output" style="width:100%;min-height:80px;padding:10px;border-radius:10px;background:#111;color:#fff;white-space:pre-wrap;margin-bottom:6px;"></div>
<div id="meng-preview-log" style="width:100%;padding:6px 10px;border-radius:10px;background:#222;color:#8b5cf6;white-space:pre-wrap;margin-bottom:12px;"></div>
<div id="meng-live-log" style="width:100%;max-height:100px;overflow-y:auto;background:#111;color:#fff;padding:6px 10px;border-radius:8px;margin-bottom:12px;"></div>

<button id="meng-preview-run" style="width:100%;padding:10px;border:none;border-radius:10px;background:#8b5cf6;color:white;cursor:pointer;margin-bottom:18px;">🔎 预览效果</button>
<button id="meng-export" style="width:48%;margin-right:4%;padding:12px;border:none;border-radius:12px;background:#10b981;color:white;font-size:1rem;font-weight:bold;cursor:pointer;">📤 导出规则</button>
<button id="meng-import" style="width:48%;padding:12px;border:none;border-radius:12px;background:#3b82f6;color:white;font-size:1rem;font-weight:bold;cursor:pointer;">📥 导入规则</button>
<button id="meng-save" style="width:100%;padding:14px;border:none;border-radius:12px;background:#8b5cf6;color:white;font-size:1rem;font-weight:bold;cursor:pointer;margin-top:12px;">💾 保存设置</button>
</div></div>
`;

    $("body").append(html);
    $("#meng-close").off("click").on("click",()=>$("#meng-overlay").remove());

    // ===== 面板样式优化 =====
    $("#meng-overlay").css({"backdrop-filter":"blur(6px)","transition":"opacity 0.25s"});
    $("#meng-overlay > div").css({"transition":"all 0.25s","box-shadow":"0 8px 25px rgba(0,0,0,0.45)"});

    // ===== 渲染列表函数 =====
    
    function renderToggle(containerId, rules, isSimple = false) {
        const container = $(containerId);
        container.empty();

        if (!Array.isArray(rules)) {
            console.warn("renderToggle received invalid rules:", rules);
            return;
        }

        rules.forEach((item) => {
            if (!item) return;

            if (typeof item === "string") {
                item = { text: item, enabled: true };
            }
 
            const row = $(`
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;">
                    <input type="checkbox" ${item.enabled ? 'checked' : ''}>
                    <span style="flex:1;color:${isSimple ? '#facc15' : '#38bdf8'}">
                        ${isSimple ? (item.text || '') : JSON.stringify(item)}
                    </span>
                    <small style="color:#888;margin-left:4px;">${item.desc || ''}</small>
                </div>
            `);

            row.find('input[type=checkbox]').on('change', function () {
                item.enabled = this.checked;
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
        settings.nameFixMap[from]=to;
        renderToggle("#meng-namefix-container",Object.entries(settings.nameFixMap || {}).map(([f,t])=>({from:f,to:t,enabled:true,desc:'手动添加'})));
        saveSettingsDebounced();
        $("#meng-namefix-new-from,#meng-namefix-new-to").val('');
    });

    $("#meng-simple-add").off("click").on("click",()=>{
        const val=$("#meng-simple-new").val().trim();
        if(!val) return alert("请填写脏词或替换");
        settings.simpleReplacements.push({text:val,enabled:true});
        renderToggle("#meng-simple-container",settings.simpleReplacements,true);
        saveSettingsDebounced();
        $("#meng-simple-new").val('');
    });

    $("#meng-regex-add").off("click").on("click",()=>{
        const pattern=$("#meng-regex-new-pattern").val().trim();
        const replace=$("#meng-regex-new-replace").val().trim();
        if(!pattern) return alert("请填写正则 pattern");
        settings.regexRules.push({pattern,replace,enabled:true,_regex:{}});
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
    renderToggle("#meng-namefix-container",Object.entries(settings.nameFixMap || {}).map(([from,to])=>({from,to,enabled:true,desc:'根据已知正确名字修正'})));
    renderToggle("#meng-simple-container",settings.simpleReplacements,true);
    renderToggle("#meng-regex-container",settings.regexRules);
    renderToggle("#meng-context-container",settings.contextRules);

    // ===== 保存按钮 =====
    $("#meng-save").off("click").on("click",()=>{
        try{
            const nameRules={};
            $("#meng-namefix-container input[type=checkbox]").each(function(){
                if(this.checked){
                    nameRules[$(this).data('from')]=$(this).data('to');
                }
            });
            settings.nameFixMap=nameRules;
            settings.simpleReplacements = (settings.simpleReplacements || []).filter(i => i.enabled);
            settings.regexRules = (settings.regexRules || []).filter(i => i.enabled);
            settings.contextRules = (settings.contextRules || []).filter(i => i.enabled);
            extension_settings[PLUGIN_ID]=settings;
            saveSettingsDebounced();
            alert("✧ 梦晏晨设置已保存");
        }catch(e){alert("⚠️ 保存失败");}
    });

    // ===== 预览 & 日志 =====
    $("#meng-preview-run").off("click").on("click", () => {
        const input = $("#meng-preview-input").val() || "";

        // ⚠️ 安全检查 + 延迟重试
        if (!window.MengYanChen) window.MengYanChen = {};
        if (!window.MengYanChen.pendingConfirmations) window.MengYanChen.pendingConfirmations = [];
        if (!window.MengYanChen.correctNames) window.MengYanChen.correctNames = new Set();

        if (!window.MengCleaner || typeof window.MengCleaner.cleanText !== 'function') {
            console.warn("⚠️ MengCleaner 未初始化，延迟执行...");
            setTimeout(() => $("#meng-preview-run").click(), 500);
            return;
        }

        const cleanedText = window.MengCleaner.cleanText(input, settings);

        // 待确认新名字显示
        const pendingDiv = $("#pending-confirm-container");
        pendingDiv.empty();
        window.MengYanChen.pendingConfirmations.forEach(i => {
            const row = $(`<div>${i.wrong} → ${i.correct} <button style="margin-left:8px;">确认</button></div>`);
            row.find("button").on("click", () => { 
                window.MengYanChen.correctNames.add(i.correct);            window.MengYanChen.pendingConfirmations.splice(window.MengYanChen.pendingConfirmations.indexOf(i), 1);
                row.remove(); 
            });
            pendingDiv.append(row);
         });

         // 日志显示
         $("#meng-preview-output").text(cleanedText);
         $("#meng-preview-log").html(`
             📝 本轮清洗日志：
             <span style="color:#38bdf8;">名字修正 ${Object.keys(settings.nameFixMap||{}).length}</span>，
             <span style="color:#facc15;">脏词 ${settings.simpleReplacements.length}</span>，
             <span style="color:#e879f9;">正则 ${settings.regexRules.length}</span>，
             <span style="color:#f87171;">上下文删除 ${settings.contextRules.length}</span>
         `);
         $("#meng-live-log").append(`🕒 [${new Date().toLocaleTimeString()}] 🔍 本轮预览完成\n`);
         $("#meng-live-log").scrollTop($("#meng-live-log")[0].scrollHeight);
     });

    // ===== 导入/导出规则 =====
    $("#meng-export").off("click").on("click",()=>{
        const json=JSON.stringify(settings,null,2);
        const blob=new Blob([json],{type:'application/json'});
        const a=document.createElement('a');
        a.href=URL.createObjectURL(blob);
        a.download=`梦晏晨-规则备份-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        alert("📂 规则已导出，可以备份或在其他设备导入");
    });

    $("#meng-import").off("click").on("click",()=>{
        const input=document.createElement('input');
        input.type='file'; input.accept='.json';
        input.onchange=e=>{
            const file=e.target.files[0];
            const reader=new FileReader();
            reader.onload=()=>{
                try{
                    const imported=JSON.parse(reader.result);
                    Object.assign(settings,imported);
                    extension_settings[PLUGIN_ID]=settings;
                    saveSettingsDebounced();
                    alert('📥 导入成功！');
                    location.reload();
                }catch{alert('⚠️ 文件格式错误');}
            };
            reader.readAsText(file);
        };
        input.click();
        alert("📥 请选择之前导出的规则 JSON 文件进行导入");
    });
}

// ===== 注入按钮 =====
function injectPandaButton(context){
    const target=$("#data_bank_wand_container");
    if(!target.length){setTimeout(()=>injectPandaButton(context),1000);return;}
    if($("#meng-panda-btn").length) return;
    const btn=$(`
<div id="meng-panda-btn" style="cursor:pointer;padding:6px 10px;border-radius:12px;background:rgba(255,255,255,0.08);display:flex;align-items:center;gap:6px;font-size:1rem;margin-top:4px;">
<span>🐼</span><span>梦晏晨</span>
</div>`);
    btn.on("click",()=>openMengPanel(context));
    target.append(btn);
    console.log("[梦晏晨] 🐼 已成功注入");
}

// ===== 暴露 API =====
window.MengUI={openMengPanel,injectPandaButton};
export { openMengPanel, injectPandaButton };  