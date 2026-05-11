(function () {
    // 1. 获取酒馆的核心组件
    const {
        eventSource,
        event_types,
        extension_settings,
        saveSettingsDebounced,
        getContext
    } = window.SillyTavern.extensions;

    const PLUGIN_ID = 'meng-yan-chen';

    // 2. 初始化设置
    if (!extension_settings[PLUGIN_ID]) {
        extension_settings[PLUGIN_ID] = {
            nameFixMap: { '林晟': '林晨', '林辰': '林晨', '洛君景': '洛君瑾' },
            banListSimple: ['指尖', '深邃', '眸子', '博弈', '石像', '野兽', '公狗', '母狗', '笼中鸟', '缠绵', '羁绊', '宿命', '暗流涌动', '瓷娃娃', '木偶', '提线木偶'],
        };
    }
    const settings = extension_settings[PLUGIN_ID];

    // 3. 文字清洗核心
    function cleanText(text) {
        if (!text || typeof text !== 'string') return text;
        let res = text;
        for (const [w, c] of Object.entries(settings.nameFixMap)) res = res.split(w).join(c);
        settings.banListSimple.forEach(word => { res = res.split(word).join(''); });
        return res;
    }

    // 4. 设置面板 UI
    function showSettings() {
        const html = `
        <div id="meng-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:99999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px);">
            <div style="background:var(--mainColor); border:2px solid #a78bfa; padding:20px; border-radius:15px; width:85%; max-width:400px; color:white;">
                <h3 style="text-align:center; color:#a78bfa;">✧ 梦晏晨 · 文辞净斋 ✧</h3>
                <textarea id="meng-in" class="text_pole" style="width:100%; height:200px; margin-top:10px;">${settings.banListSimple.join('\n')}</textarea>
                <div style="margin-top:20px; display:flex; gap:10px;">
                    <button id="meng-ok" class="menu_button" style="flex:1; background:#7c3aed !important; color:white !important;">保存</button>
                    <button id="meng-no" class="menu_button" style="flex:1;">关闭</button>
                </div>
            </div>
        </div>`;
        $('body').append(html);
        $('#meng-no').click(() => $('#meng-modal').remove());
        $('#meng-ok').click(() => {
            settings.banListSimple = $('#meng-in').val().split('\n').filter(x => x.trim());
            saveSettingsDebounced();
            $('#meng-modal').remove();
            window.toastr.success('保存成功！');
        });
    }

    // 5. 注入到界面（参考 QwQ361 大佬的注入点）
    function init() {
        // A. 顶部图标栏
        if (!$('#meng-top-icon').length) {
            const topIcon = $(`<div id="meng-top-icon" class="fa-solid fa-broom nav-bar-item" title="梦晏晨设置" style="cursor:pointer;"></div>`);
            // 放到顶部右侧图标区域
            $('.nav-bar-right').prepend(topIcon);
            topIcon.on('click', showSettings);
        }

        // B. 扩展列表设置页
        if (!$('#meng-extension-ctrl').length) {
            const settingsHtml = `
            <div id="meng-extension-ctrl" class="inline-drawer">
                <div class="inline-drawer-header">
                    <div class="inline-drawer-icon"><i class="fa-solid fa-broom"></i></div>
                    <div class="inline-drawer-title">梦晏晨 · 文辞净斋</div>
                    <div id="meng-gear" class="inline-drawer-icon" style="cursor:pointer;"><i class="fa-solid fa-gear"></i></div>
                </div>
                <div class="inline-drawer-content">
                    <button id="meng-open-ui" class="menu_button">打开过滤配置</button>
                </div>
            </div>`;
            $('#extensions_settings').append(settingsHtml);
            $('#meng-gear, #meng-open-ui').on('click', showSettings);
        }
    }

    // 6. 启动与监听
    $(document).ready(() => {
        init();
        
        // 监听消息渲染
        eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (msgId) => {
            const context = getContext();
            if (context.chat && context.chat[msgId]) {
                context.chat[msgId].mes = cleanText(context.chat[msgId].mes);
            }
        });

        console.log("梦晏晨插件加载完毕 (No-Import版)");
    });
})();
