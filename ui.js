// ======================
// 自动学习新名字辅助函数
// ======================
const correctNames = new Set(['林晨','谢知许','洛君瑾']); // 已确认正确名字
const pendingConfirmations = []; // 待确认列表

function isCommonWord(word){
    const commonSet = new Set(['早安','谢谢','手机','你好','你好呀','今天']);
    return commonSet.has(word);
}

// 简单相似度函数（基于汉字编辑距离）
function calcSimilarity(a,b){
    if(!a||!b) return 0;
    let diff=0;
    for(let i=0;i<Math.max(a.length,b.length);i++){
        if(a[i]!==b[i]) diff++;
    }
    return 1 - diff/Math.max(a.length,b.length);
}

// 扫描新名字
function scanForNewNames(text,settings){
    pendingConfirmations.length = 0;
    const chineseWords = text.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    const newNames = [...new Set(chineseWords)].filter(name=>{
        return !correctNames.has(name) && !settings.nameFixMap[name] && !isCommonWord(name);
    });
    for(const newName of newNames){
        for(const correct of correctNames){
            const sim = calcSimilarity(newName,correct);
            if(sim > 0.7){
                settings.nameFixMap[newName] = correct;
                pendingConfirmations.push({wrong:newName,correct});
            }
        }
    }
}

// ======================
// processMessage 扩展版（UI.js 调用）
// ======================
function processMessageWithLearning(msg,messageId,settings){
    if(!msg?.mes && !msg?.content) return;
    const field = msg.mes ? "mes":"content";
    scanForNewNames(msg[field],settings);
    const cleaned = window.MengCleaner.cleanText(msg[field],settings);
    msg[field] = cleaned;
}

// ======================
// UI主界面
// ======================
function openMengPanel(context){
    const {settings,extension_settings,saveSettingsDebounced,PLUGIN_ID} = context;
    if($("#meng-overlay").length) return;

    const html = `
<div id="meng-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.65);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);">
<div style="width:90%;max-width:520px;max-height:85vh;overflow:auto;background:#1e1e1e;border-radius:18px;padding:18px;color:white;box-shadow:0 0 25px rgba(0,0,0,0.5);">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
<div style="font-size:1.2rem;font-weight:bold;">🐼 梦晏晨 · 文辞净斋</div>
<div id="meng-close" style="cursor:pointer;font-size:1.2rem;">✕</div>
</div>
<hr>
<h3>📛 名字修正</h3><div id="meng-namefix-container"></div>
<h3>🗑️ 简单脏词</h3><div id="meng-simple-container"></div>
<h3>⚙️ 正则清洗 (JSON格式)</h3><div id="meng-regex-container"></div>
<h3>✂️ 上下文删除 (JSON格式)</h3><div id="meng-context-container"></div>
<h3>🔍 实时预览 & 日志</h3>
<textarea id="meng-preview-input" style="width:100%;height:100px;margin-bottom:6px;border-radius:10px;padding:10px;background:#2b2b2b;color:white;border:none;" placeholder="粘贴测试文本..."></textarea>
<div id="meng-preview-output" style="width:100%;min-height:80px;padding:10px;border-radius:10px;background:#111;color:#fff;white-space:pre-wrap;margin-bottom:6px;"></div>
<div id="meng-preview-log" style="width:100%;padding:6px 10px;border-radius:10px;background:#222;color:#8b5cf6;white-space:pre-wrap;margin-bottom:12px;"></div>
<button id="meng-preview-run" style="width:100%;padding:10px;border:none;border-radius:10px;background:#8b5cf6;color:white;cursor:pointer;margin-bottom:18px;">🔎 预览效果</button>
<button id="meng-export" style="width:48%;margin-right:4%;padding:12px;border:none;border-radius:12px;background:#10b981;color:white;font-size:1rem;font-weight:bold;cursor:pointer;">📤 导出规则</button>
<button id="meng-import" style="width:48%;padding:12px;border:none;border-radius:12px;background:#3b82f6;color:white;font-size:1rem;font-weight:bold;cursor:pointer;">📥 导入规则</button>
<button id="meng-save" style="width:100%;padding:14px;border:none;border-radius:12px;background:#8b5cf6;color:white;font-size:1rem;font-weight:bold;cursor:pointer;margin-top:12px;">💾 保存设置</button>
</div></div>
`;
    $("body").append(html);
    $("#meng-close").off("click").on("click",()=>$("#meng-overlay").remove());

    // ===== Helper: 渲染带 toggle 的规则列表 =====
    function renderToggle(containerId,rules,isSimple=false){
        const container=$(containerId);
        container.empty();
        rules.forEach((item,idx)=>{
            if(typeof item==="string") item={text:item,enabled:true};
            const row=$(`
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;">
                    <input type="checkbox" ${item.enabled?'checked':''} data-from="${item.from||item.text}" data-to="${item.to||item.text}">
                    <span style="flex:1">${isSimple?item.text:JSON.stringify(item)}</span>
                </div>
            `);
            row.find('input[type=checkbox]').on('change',function(){
                item.enabled=this.checked;
                saveSettingsDebounced();
            });
            container.append(row);
        });
    }

    // ===== 初始化 toggle 列表 =====
    settings.nameFixMap=settings.nameFixMap||{};
    settings.simpleReplacements=(settings.simpleReplacements||[]).map(i=>i.enabled===undefined?{...i,enabled:true}:i);
    settings.regexRules=(settings.regexRules||[]).map(i=>i.enabled===undefined?{...i,enabled:true}:i);
    settings.contextRules=(settings.contextRules||[]).map(i=>i.enabled===undefined?{...i,enabled:true}:i);

    renderToggle("#meng-namefix-container",Object.entries(settings.nameFixMap).map(([from,to])=>({from,to,enabled:true})));
    renderToggle("#meng-simple-container",settings.simpleReplacements,true);
    renderToggle("#meng-regex-container",settings.regexRules);
    renderToggle("#meng-context-container",settings.contextRules);

    // ===== 保存按钮 =====
    $("#meng-save").off("click").on("click",()=>{
        try{
            // 名字修正
            const nameRules={};
            $("#meng-namefix-container input[type=checkbox]").each(function(){
                if(this.checked){
                    nameRules[$(this).data('from')]=$(this).data('to');
                }
            });
            settings.nameFixMap=nameRules;

            settings.simpleReplacements=settings.simpleReplacements.filter(i=>i.enabled);
            settings.regexRules=settings.regexRules.filter(i=>i.enabled);
            settings.contextRules=settings.contextRules.filter(i=>i.enabled);

            extension_settings[PLUGIN_ID]=settings;
            saveSettingsDebounced();
            alert("✧ 梦晏晨设置已保存");
        }catch(e){alert("⚠️ 保存失败");}
    });

    // ===== 预览 & 日志 =====
    $("#meng-preview-run").off("click").on("click",()=>{
        const input=$("#meng-preview-input").val()||"";
        pendingConfirmations.length=0;
        const tempMsg={content:input};
        processMessageWithLearning(tempMsg,0,settings);
        let text=tempMsg.content;

        let log={nameFixes:0,simpleRemovals:0,regexRemovals:0,contextRemovals:0};

        // 名字修正日志
        for(const [from,to] of Object.entries(settings.nameFixMap||{})){
            if(text.includes(to)) log.nameFixes++;
            text=text.replaceAll(to,`<mark>${to}</mark>`);
        }

        // 简单脏词日志
        for(const rule of settings.simpleReplacements||[]){
            if(!rule.enabled) continue;
            try{
                const regex=new RegExp(rule.from,"g");
                const matches=text.match(regex);
                if(matches) log.simpleRemovals+=matches.length;
                text=text.replace(regex,`<mark>${rule.to}</mark>`);
            }catch(e){console.warn("脏词正则有误:",rule.from);}
        }

        // 正则日志
        for(const rule of settings.regexRules||[]){
            if(!rule.enabled) continue;
            try{
                const regex=new RegExp(rule.pattern,rule.flags||"g");
                const matches=text.match(regex);
                if(matches) log.regexRemovals+=matches.length;
                text=text.replace(regex,`<mark>${rule.replace||""}</mark>`);
            }catch(e){console.warn("正则有误:",rule.pattern);}
        }

        // 上下文删除日志
        for(const rule of settings.contextRules||[]){
            if(!rule.enabled) continue;
            try{
                const fullRegex=new RegExp(`([^。！？；\\n]*${rule.pattern}[^。！？；\\n]*)`,'g');
                const matches=text.match(fullRegex);
                if(matches) log.contextRemovals+=matches.length;
                text=text.replace(fullRegex,`<mark>【删除句子】</mark>`);
            }catch(e){console.warn("上下文正则有误:",rule.pattern);}
        }

        text=text.replace(/\n{3,}/g,"\n\n").replace(/[ \t]{2,}/g," ");
        $("#meng-preview-output").html(text);
        const list=pendingConfirmations.map(i=>`${i.wrong} → ${i.correct}`).join("\n");
        $("#meng-preview-log").text(`📝 本轮清洗日志：名字修正 ${log.nameFixes}，脏词 ${log.simpleRemovals}，正则 ${log.regexRemovals}，上下文删除 ${log.contextRemovals}\n待确认新名字:\n${list}`);
    });

    // ===== 导入/导出规则 =====
    $("#meng-export").off("click").on("click",()=>{
        const json=JSON.stringify(settings,null,2);
        const blob=new Blob([json],{type:'application/json'});
        const a=document.createElement('a');
        a.href=URL.createObjectURL(blob);
        a.download=`梦晏晨-规则备份-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
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
                    alert('✅ 导入成功！');
                    location.reload();
                }catch{alert('⚠️ 文件格式错误');}
            };
            reader.readAsText(file);
        };
        input.click();
    });
}

// ======================
// 注入按钮
// ======================
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

// ======================
// 暴露 API
// ======================
window.MengUI={openMengPanel,injectPandaButton};