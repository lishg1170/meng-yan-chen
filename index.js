import { eventSource, event_types, extension_settings, getContext, saveSettingsDebounced } from '../../../extensions.js';

const PLUGIN_ID = 'meng-yan-chen';

// 默认设置
const defaultSettings = {
    nameFixMap: { '林晟': '林晨', '林辰': '林晨', '洛君景': '洛君瑾' },
    banListSimple: ['指尖', '深邃', '眸子', '博弈', '石像', '野兽', '公狗', '母狗', '笼中鸟', '缠绵', '羁绊', '宿命', '暗流涌动', '瓷娃娃', '木偶', '提线木偶'],
    banListRegex: ['像.{0,10}(?:石头|木头|冰块)', '眼神中闪过一丝.{0,15}'],
};

if (!extension_settings[PLUGIN_ID]) {
    extension_settings[PLUGIN_ID] = Object.assign({}, defaultSettings);
}
let settings = extension_settings[PLUGIN_ID];

function cleanText(text) {
    if (!text || typeof text !== 'string') return text;
    let res = text;
    for (const [w, c] of Object.entries(settings.nameFixMap)) res = res.split(w).join(c);
    settings.banListSimple.forEach(word => { res = res.split(word).join(''); });
    return res;
}

// 简单的弹窗 UI
function showMyPanel() {
    alert('梦晏晨插件已运行！你可以在左侧“扩展设置”里找到我（如果酒馆支持动态注入）。');
}

$(document).ready(() => {
    // 在右下角强行塞一个熊猫
    const panda = $('<div id="meng-panda" style="position:fixed; bottom:20px; right:20px; z-index:9999; cursor:pointer; font-size:30px; background:white; border-radius:50%; padding:5px; border:1px solid #ccc;">🐼</div>');
    $('body').append(panda);
    panda.on('click', () => {
        const simpleList = prompt("输入屏蔽词（用中文逗号分隔）:", settings.banListSimple.join('，'));
        if (simpleList) {
            settings.banListSimple = simpleList.split('，').filter(x => x.trim());
            saveSettingsDebounced();
            alert('保存成功！');
        }
    });

    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (msgId) => {
        const msg = getContext().chat[msgId];
        if (msg) msg.mes = cleanText(msg.mes);
    });
    console.log("梦晏晨插件加载成功");
});
