(function() {
    const PLUGIN_ID = 'meng-yan-chen';
    const extensions = window.SillyTavern?.extensions || {};
    const extension_settings = extensions.extension_settings || {};
    const saveSettingsDebounced = extensions.saveSettingsDebounced || (()=>{});

    const defaultSettings = {
        nameFixMap: { '林晟':'林晨','林辰':'林晨' },
        banListSimple: ['指尖','深邃','眸子','博弈','石像'],
        banListRegex: ['像.{0,10}(?:石头|木头|冰块)','眼神中闪过一丝.{0,15}']
    };

    let settings = extension_settings[PLUGIN_ID] || defaultSettings;
    if (!extension_settings[PLUGIN_ID]) extension_settings[PLUGIN_ID] = settings;

    // ===== 文本清洗 =====
    function cleanText(text) {
        if (!text) return text;
        Object.entries(settings.nameFixMap).forEach(([wrong,correct])=>{
            text = text.split(wrong).join(correct);
        });
        settings.banListSimple.forEach(word=>{ text = text.split(word).join(''); });
        settings.banListRegex.forEach(pattern=>{
            try{text = text.replace(new RegExp(pattern,'g'),'');}catch(e){}
        });
        return text;
    }

    function processMessage(msg){
        if(msg?.content){
            const cleaned = cleanText(msg.content);
            if(msg.content!==cleaned){
                msg.content = cleaned;
                console.log('[梦晏晨] ✧ 已清理文字');
            }
        }
    }

    // ===== 创建设置面板 =====
    function createSettingsPanel(){
        const panel = $(`
        <div style="padding:16px; max-width:400px; color: var(--SmartThemeTextColor); font-family: var(--mainFontFamily);">
            <h3>✧ 梦晏晨 · 文辞净斋</h3>
            <div id="meng-name-list"></div>
            <h4>简单脏词（一行一个）</h4>
            <textarea id="meng-simple" rows="5">${settings.banListSimple.join('\n')}</textarea>
            <h4>复杂正则（一行一条）</h4>
            <textarea id="meng-regex" rows="5">${settings.banListRegex.join('\n')}</textarea>
            <button id="meng-save">💾 保存设置</button>
            <div id="meng-status" style="margin-top:8px;opacity:0.8;"></div>
        </div>
        `);

        function loadUI(){
            const nameList = panel.find('#meng-name-list');
            nameList.empty();
            Object.entries(settings.nameFixMap).forEach(([wrong,correct])=>{
                const row = $(`
                <div class="meng-row" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:6px;">
                    <input class="meng-wrong" value="${wrong}" style="flex:1 1 40%;">
                    <span>➜</span>
                    <input class="meng-correct" value="${correct}" style="flex:1 1 40%;">
                    <button class="meng-del-name">✕</button>
                </div>`);
                nameList.append(row);
                row.find('.meng-del-name').on('click',()=>row.remove());
            });
        }
        setTimeout(loadUI,80);

        panel.find('#meng-save').on('click',()=>{
            const nameMap={};
            panel.find('#meng-name-list .meng-row').each(function(){
                const wrong=$(this).find('.meng-wrong').val()?.trim();
                const correct=$(this).find('.meng-correct').val()?.trim();
                if(wrong && correct) nameMap[wrong]=correct;
            });
            settings.nameFixMap=nameMap;
            settings.banListSimple=panel.find('#meng-simple').val().split('\n').map(s=>s.trim()).filter(s=>s);
            settings.banListRegex=panel.find('#meng-regex').val().split('\n').map(s=>s.trim()).filter(s=>s);
            extension_settings[PLUGIN_ID]=settings;
            saveSettingsDebounced();
            panel.find('#meng-status').text('✧ 已保存！').fadeIn(200).delay(2000).fadeOut(200);
        });

        return panel;
    }

    // ===== 注入小熊猫按钮 =====
    function injectPandaButton(){
        const target = $('#data_bank_wand_container');
        if(!target.length) return setTimeout(injectPandaButton,300);
        if($('#meng-panda-btn').length) return;

        const btn=$(`
            <div id="meng-panda-btn" title="梦晏晨 · 文辞净斋" style="cursor:pointer; font-size:1.4rem;">🐼</div>
        `);
        btn.on('click',()=>{
            const panel=createSettingsPanel();
            if(typeof showModal==='function') showModal(panel[0],{title:'梦晏晨 · 设置', width:'600px', height:'auto'});
        });

        target.append(btn);
        console.log('[梦晏晨] 🐼 小熊猫按钮已就位');
    }

    // ===== 初始化 =====
    $(document).ready(()=>{
        injectPandaButton();
        try{
            const eventSource=extensions.eventSource;
            const event_types=extensions.event_types;
            eventSource?.on(event_types.MESSAGE_RECEIVED,processMessage);
            eventSource?.on(event_types.MESSAGE_UPDATED,processMessage);
            eventSource?.on(event_types.CHAT_CHANGED,()=>{
                const context=extensions.getContext?.();
                context?.chat?.forEach(processMessage);
            });
        }catch(e){
            console.error('[梦晏晨] 事件绑定失败',e);
        }
        console.log('[梦晏晨] ✧ 插件已就绪');
    });
})();
