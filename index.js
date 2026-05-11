(function () {
    const initPlugin = () => {
        const ST = window.SillyTavern || (window.parent && window.parent.SillyTavern);
        if (!ST) return false;

        const { eventSource, event_types, extension_settings, saveSettingsDebounced, getContext } = ST.extensions;
        const ID = 'meng-yan-chen';

        if (!extension_settings[ID]) {
            extension_settings[ID] = {
                nameFixMap: { '林晟': '林晨', '林辰': '林晨', '洛君景': '洛君瑾' },
                banListSimple: ['指尖', '深邃', '眸子', '博弈', '石像', '野兽', '公狗', '母狗', '笼中鸟', '缠绵', '羁绊', '宿命', '暗流涌动', '瓷娃娃', '木偶', '提线木偶'],
            };
        }
        const set = extension_settings[ID];

        // UI 唤起
        const openUI = () => {
            const h = `<div id="m-m" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);"><div style="background:#1a1a2e;padding:25px;border-radius:15px;width:320px;color:#fff;border:1px solid #a78bfa;box-shadow:0 0 15px #a78bfa;"><h3 style="text-align:center;color:#a78bfa;margin-top:0;">✧ 梦晏晨配置 ✧</h3><textarea id="m-i" class="text_pole" style="width:100%;height:180px;background:#000;color:#fff;border:1px solid #444;border-radius:8px;padding:10px;">${set.banListSimple.join('\n')}</textarea><div style="display:flex;gap:10px;margin-top:15px;"><button id="m-s" class="menu_button" style="flex:1;background:#7c3aed !important;">保存</button><button id="m-c" class="menu_button" style="flex:1;">关闭</button></div></div></div>`;
            document.body.insertAdjacentHTML('beforeend', h);
            document.getElementById('m-c').onclick = () => document.getElementById('m-m').remove();
            document.getElementById('m-s').onclick = () => {
                set.banListSimple = document.getElementById('m-i').value.split('\n').filter(x => x.trim());
                saveSettingsDebounced();
                document.getElementById('m-m').remove();
                if (window.toastr) window.toastr.success('梦晏晨：保存成功');
            };
        };

        // 强行注入顶部扫把
        const nav = document.querySelector('.nav-bar-right');
        if (nav && !document.getElementById('m-t')) {
            const b = document.createElement('div');
            b.id = 'm-t';
            b.className = 'fa-solid fa-broom nav-bar-item';
            b.style.cssText = 'cursor:pointer;font-size:20px;';
            nav.prepend(b);
            b.onclick = openUI;
        }

        // 拦截消息
        eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (id) => {
            const chat = getContext().chat;
            if (chat && chat[id]) {
                let txt = chat[id].mes;
                for (let [w, c] of Object.entries(set.nameFixMap)) txt = txt.split(w).join(c);
                set.banListSimple.forEach(w => { txt = txt.split(w).join(''); });
                chat[id].mes = txt;
            }
        });
        return true;
    };

    // 自动重试逻辑，解决加载过快问题
    let attempts = 0;
    const timer = setInterval(() => {
        if (initPlugin() || attempts > 10) {
            console.log("[梦晏晨] 注入成功或达到重试上限");
            clearInterval(timer);
        }
        attempts++;
    }, 1500);
})();
