// 注意这里：改成了 ../../ 
import { eventSource, event_types, extension_settings, getContext, saveSettingsDebounced } from '../../extensions.js';

const PLUGIN_ID = 'meng-yan-chen';

// 默认配置
const defaultSettings = {
    nameFixMap: { '林晟': '林晨', '林辰': '林晨', '洛君景': '洛君瑾' },
    banListSimple: ['指尖', '深邃', '眸子', '博弈', '石像', '野兽', '公狗', '母狗', '笼中鸟', '缠绵', '羁绊', '宿命', '暗流涌动', '瓷娃娃', '木偶', '提线木偶'],
    banListRegex: ['像.{0,10}(?:石头|木头|冰块)', '眼神中闪过一丝.{0,15}'],
};

// 初始化设置
if (!extension_settings[PLUGIN_ID]) {
    extension_settings[PLUGIN_ID] = Object.assign({}, defaultSettings);
}
let settings = extension_settings[PLUGIN_ID];

// 清洗逻辑
function cleanText(text) {
    if (!text || typeof text !== 'string') return text;
    let res = text;
    for (const [w, c] of Object.entries(settings.nameFixMap)) res = res.split(w).join(c);
    settings.banListSimple.forEach(word => { res = res.split(word).join(''); });
    return res;
}

// 弹窗界面
function showSettings() {
    const html = `
    <div id="meng-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:10000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(3px);">
        <div style="background:#1a1a2e; border:2px solid #a78bfa; padding:25px; border-radius:15px; width:400px; color:white; box-shadow: 0 0 20px rgba(167, 139, 250, 0.5);">
            <h3 style="margin-top:0; color:#a78bfa; text-align:center;">✧ 梦晏晨 · 设置面板 ✧</h3>
            <hr style="border:0.5px solid #333; margin:15px 0;">
            <p>修改屏蔽词 (换行分隔):</p>
            <textarea id="meng-simple-in" style="width:100%; height:120px; background:#0f0f1a; color:white; border:1px solid #444; border-radius:8px; padding:10px;">${settings.banListSimple.join('\n')}</textarea>
            <div style="display:flex; gap:10px; margin-top:20px;">
                <button id="meng-save" style="flex:1; padding:10px; background:#a78bfa; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">保存设置</button>
                <button id="meng-close" style="flex:1; padding:10px; background:#444; border:none; border-radius:8px; cursor:pointer; color:white;">关闭</button>
            </div>
        </div>
    </div>`;
    
    $('body').append(html);
    
    $('#meng-close').on('click', () => $('#meng-modal').remove());
    $('#meng-save').on('click', () => {
        settings.banListSimple = $('#meng-simple-in').val().split('\n').filter(x => x.trim());
        saveSettingsDebounced();
        $('#meng-modal').remove();
        if (window.toastr) window.toastr.success('梦晏晨：设置已保存！');
    });
}

// 启动逻辑
function init() {
    console.log("[梦晏晨] 插件正在加载...");
    
    // 1. 注入右下角熊猫
    if (!$('#meng-panda').length) {
        const panda = $('<div id="meng-panda" style="position:fixed; bottom:25px; right:25px; z-index:9999; cursor:pointer; font-size:32px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5)); transition: transform 0.2s;">🐼</div>');
        panda.hover(() => panda.css('transform', 'scale(1.2)'), () => panda.css('transform', 'scale(1)'));
        $('body').append(panda);
        panda.on('click', showSettings);
    }

    // 2. 注入左侧菜单
    const menuBtn = `
        <div class="inline-drawer">
            <div class="inline-drawer-header">
                <div class="inline-drawer-title">梦晏晨 · 文辞净斋</div>
                <div id="meng-gear" style="cursor:pointer; padding:0 10px;">⚙️</div>
            </div>
        </div>`;
    $('#extensions_settings').append(menuBtn);
    $('#meng-gear').on('click', showSettings);

    // 3. 弹出欢迎信息
    setTimeout(() => {
        if (window.toastr) window.toastr.info('梦晏晨插件已就绪 🐼');
    }, 2000);
}

// 执行初始化
$(document).ready(() => {
    init();
    
    // 拦截消息处理
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (msgId) => {
        const context = getContext();
        const msg = context.chat[msgId];
        if (msg) {
            msg.mes = cleanText(msg.mes);
        }
    });
});
