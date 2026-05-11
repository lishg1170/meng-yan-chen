import { eventSource, event_types, extension_settings, getContext, saveSettingsDebounced } from '../../extensions.js';

const PLUGIN_ID = 'meng-yan-chen';
const PLUGIN_NAME = '梦晏晨 · 文辞净斋';

// 1. 初始化设置
const defaultSettings = {
    nameFixMap: { '林晟': '林晨', '林辰': '林晨', '洛君景': '洛君瑾' },
    banListSimple: ['指尖', '深邃', '眸子', '博弈', '石像', '野兽', '公狗', '母狗', '笼中鸟', '缠绵', '羁绊', '宿命', '暗流涌动', '瓷娃娃', '木偶', '提线木偶'],
};

if (!extension_settings[PLUGIN_ID]) {
    extension_settings[PLUGIN_ID] = Object.assign({}, defaultSettings);
}
let settings = extension_settings[PLUGIN_ID];

// 2. 清洗逻辑
function cleanText(text) {
    if (!text || typeof text !== 'string') return text;
    let res = text;
    for (const [w, c] of Object.entries(settings.nameFixMap)) res = res.split(w).join(c);
    settings.banListSimple.forEach(word => { res = res.split(word).join(''); });
    return res;
}

// 3. 设置面板 UI
function showSettings() {
    $('#meng-modal').remove();
    const html = `
    <div id="meng-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:100000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px);">
        <div style="background:var(--mainColor, #1a1a2e); border:2px solid #a78bfa; padding:20px; border-radius:15px; width:400px; color:white; box-shadow:0 0 20px rgba(0,0,0,0.5);">
            <h3 style="text-align:center; color:#a78bfa; margin-top:0;">✧ ${PLUGIN_NAME} ✧</h3>
            <div style="margin-top:15px;">
                <label>屏蔽词列表 (一行一个):</label>
                <textarea id="meng-in" class="text_pole" style="width:100%; height:180px; margin-top:10px; font-family:monospace;">${settings.banListSimple.join('\n')}</textarea>
            </div>
            <div style="margin-top:20px; display:flex; gap:10px;">
                <button id="meng-ok" class="menu_button" style="flex:1; background:#7c3aed !important; color:white !important;">保存设置</button>
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
        if (window.toastr) window.toastr.success('梦晏晨：配置已保存！');
    });
}

// 4. 注入三个入口
function injectExtensions() {
    console.log("[梦晏晨] 开始多路注入...");

    // 入口 A: 顶部图标栏 (Top Bar)
    if (!$('#meng-top-icon').length) {
        const topIcon = $(`<div id="meng-top-icon" class="fa-solid fa-broom nav-bar-item" title="${PLUGIN_NAME}" style="cursor:pointer; font-size:20px; order: 10;"></div>`);
        $('.nav-bar-right').prepend(topIcon); // 插入到右侧图标栏最前面
        topIcon.on('click', showSettings);
    }

    // 入口 B: 扩展菜单 (Extensions Drawer)
    if (!$('#meng-drawer').length) {
        const drawerHtml = `
            <div id="meng-drawer" class="inline-drawer">
                <div class="inline-drawer-header">
                    <div class="inline-drawer-icon"><i class="fa-solid fa-broom"></i></div>
                    <div class="inline-drawer-title">${PLUGIN_NAME}</div>
                    <div class="inline-drawer-icon meng-settings-click" style="cursor:pointer;"><i class="fa-solid fa-gear"></i></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="menu_button meng-settings-click">打开净化配置</div>
                </div>
            </div>`;
        $('#extensions_settings').append(drawerHtml);
        $('.meng-settings-click').on('click', showSettings);
    }

    // 入口 C: 魔法棒/快速操作 (Quick Action)
    if (!$('#meng-quick-action').length) {
        // 尝试在消息模板或魔法棒区域添加一个按钮 (取决于酒馆版本)
        const quickBtn = $(`<div id="meng-quick-action" class="menu_button fa-solid fa-broom" title="${PLUGIN_NAME}" style="display:inline-block; width:auto; margin:5px;"> 清洗配置</div>`);
        $('#quick_continuation_container').append(quickBtn); // 这是酒馆内置的一个快速容器
        quickBtn.on('click', showSettings);
    }
}

// 启动
$(document).ready(() => {
    // 延迟注入，确保酒馆 DOM 加载完毕
    setTimeout(injectExtensions, 2000);
    
    // 拦截消息渲染
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (msgId) => {
        const context = getContext();
        if (context.chat && context.chat[msgId]) {
            context.chat[msgId].mes = cleanText(context.chat[msgId].mes);
        }
    });
});
