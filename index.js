(function () {
    // 1. 定义插件的核心逻辑
    const extensionName = "meng-yan-chen";
    const extensionSettings = window.SillyTavern.extensions.extension_settings;

    // 默认配置
    if (!extensionSettings[extensionName]) {
        extensionSettings[extensionName] = {
            nameFixMap: { '林晟': '林晨', '林辰': '林晨', '洛君景': '洛君瑾' },
            banListSimple: ['指尖', '深邃', '眸子', '博弈', '石像', '野兽', '公狗', '母狗', '笼中鸟', '缠绵', '羁绊', '宿命', '暗流涌动', '瓷娃娃', '木偶', '提线木偶'],
        };
    }

    const settings = extensionSettings[extensionName];

    // 清洗函数
    function cleanText(text) {
        if (!text || typeof text !== 'string') return text;
        let res = text;
        for (const [w, c] of Object.entries(settings.nameFixMap)) res = res.split(w).join(c);
        settings.banListSimple.forEach(word => { res = res.split(word).join(''); });
        return res;
    }

    // 面板 UI
    function showSettings() {
        const html = `
        <div id="meng-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:999999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px);">
            <div style="background:var(--mainColor); border:2px solid #a78bfa; padding:20px; border-radius:15px; width:85%; max-width:400px; color:white;">
                <h3 style="text-align:center; color:#a78bfa;">✧ 梦晏晨 · 文辞净斋 ✧</h3>
                <textarea id="meng-in" class="text_pole" style="width:100%; height:200px; margin-top:10px;">${settings.banListSimple.join('\n')}</textarea>
                <div style="margin-top:20px; display:flex; gap:10px;">
                    <button id="meng-ok" class="menu_button" style="flex:1; background:#7c3aed !important; color:white !important;">保存</button>
                    <button id="meng-no" class="menu_button" style="flex:1;">关闭</button>
                </div>
            </div>
        </div>`;
        jQuery(document.body).append(html);
        jQuery('#meng-no').on('click', () => jQuery('#meng-modal').remove());
        jQuery('#meng-ok').on('click', () => {
            settings.banListSimple = jQuery('#meng-in').val().split('\n').filter(x => x.trim());
            window.SillyTavern.extensions.saveSettingsDebounced();
            jQuery('#meng-modal').remove();
            if (window.toastr) window.toastr.success('已存入净斋');
        });
    }

    // 2. 核心：向酒馆注册自己
    function setupExtension() {
        // 注入顶部图标
        const topBar = jQuery('.nav-bar-right');
        if (topBar.length && !jQuery('#meng-top-icon').length) {
            const btn = jQuery('<div id="meng-top-icon" class="fa-solid fa-broom nav-bar-item" title="梦晏晨" style="cursor:pointer;"></div>');
            topBar.prepend(btn);
            btn.on('click', showSettings);
        }

        // 注入设置页面
        const settingsPane = jQuery('#extensions_settings');
        if (settingsPane.length && !jQuery('#meng-ext-item').length) {
            const html = `
                <div id="meng-ext-item" class="inline-drawer">
                    <div class="inline-drawer-header">
                        <div class="inline-drawer-icon"><i class="fa-solid fa-broom"></i></div>
                        <div class="inline-drawer-title">梦晏晨 · 文辞净斋</div>
                        <div class="inline-drawer-icon meng-gear" style="cursor:pointer;"><i class="fa-solid fa-gear"></i></div>
                    </div>
                </div>`;
            settingsPane.append(html);
            jQuery('#meng-ext-item .meng-gear').on('click', showSettings);
        }
    }

    // 3. 绑定酒馆事件
    jQuery(document).ready(function () {
        setupExtension();
        
        // 监听渲染事件
        window.SillyTavern.extensions.eventSource.on(
            window.SillyTavern.extensions.event_types.CHARACTER_MESSAGE_RENDERED,
            (msgId) => {
                const chat = window.SillyTavern.extensions.getContext().chat;
                if (chat && chat[msgId]) {
                    chat[msgId].mes = cleanText(chat[msgId].mes);
                }
            }
        );
        
        console.log("梦晏晨扩展已通过官方协议加载");
    });

})();
