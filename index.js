(function () {
    // 这是一个检查函数，专门看酒馆准备好没有
    function startup() {
        // 检查全局变量是否存在
        if (!window.SillyTavern || !window.SillyTavern.extensions || !window.SillyTavern.extensions.extension_settings) {
            console.log("[梦晏晨] 酒馆核心尚未加载，1秒后重试...");
            return; // 还没准备好，跳出，等下次定时器触发
        }

        // 走到这里，说明酒馆终于“出生”了！
        clearInterval(loadTimer); // 停止复读机
        
        const ST = window.SillyTavern.extensions;
        const PID = 'meng-yan-chen';

        // 1. 初始化设置
        if (!ST.extension_settings[PID]) {
            ST.extension_settings[PID] = {
                nameFixMap: { '林晟': '林晨', '林辰': '林晨', '洛君景': '洛君瑾' },
                banListSimple: ['指尖', '深邃', '眸子', '博弈', '石像', '野兽', '公狗', '母狗', '笼中鸟', '缠绵', '羁绊', '宿命', '暗流涌动', '瓷娃娃', '木偶', '提线木偶'],
            };
        }
        const set = ST.extension_settings[PID];

        // 2. 清洗逻辑
        const doClean = (t) => {
            if (!t || typeof t !== 'string') return t;
            let r = t;
            for (let [w, c] of Object.entries(set.nameFixMap)) r = r.split(w).join(c);
            set.banListSimple.forEach(w => { r = r.split(w).join(''); });
            return r;
        };

        // 3. UI 界面
        const showUI = () => {
            const h = `<div id="m-m" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);"><div style="background:var(--mainColor,#1a1a2e);padding:20px;border-radius:15px;width:300px;color:#fff;border:1px solid #a78bfa;"><h3 style="text-align:center">梦晏晨配置</h3><textarea id="m-i" class="text_pole" style="width:100%;height:150px;background:#000;color:#fff;">${set.banListSimple.join('\n')}</textarea><button id="m-s" class="menu_button" style="width:100%;margin-top:10px;background:#7c3aed !important;">保存</button><button id="m-c" class="menu_button" style="width:100%;margin-top:5px;">关闭</button></div></div>`;
            jQuery('body').append(h);
            jQuery('#m-c').on('click', () => jQuery('#m-m').remove());
            jQuery('#m-s').on('click', () => {
                set.banListSimple = jQuery('#m-i').val().split('\n').filter(x => x.trim());
                ST.saveSettingsDebounced();
                jQuery('#m-m').remove();
            });
        };

        // 4. 注入图标
        const addIcon = () => {
            if (jQuery('#meng-top-icon').length) return;
            const nav = jQuery('.nav-bar-right');
            if (nav.length) {
                const b = jQuery('<div id="meng-top-icon" class="fa-solid fa-broom nav-bar-item" title="梦晏晨" style="cursor:pointer;"></div>');
                nav.prepend(b);
                b.on('click', showUI);
            }
        };

        // 5. 绑定事件
        addIcon();
        ST.eventSource.on(ST.event_types.CHARACTER_MESSAGE_RENDERED, (id) => {
            const c = ST.getContext().chat;
            if (c && c[id]) c[id].mes = doClean(c[id].mes);
        });

        console.log("[梦晏晨] 终于成功报到了！");
    }

    // 启动“复读机”，每 1000 毫秒（1秒）检查一次酒馆有没有准备好
    const loadTimer = setInterval(startup, 1000);
})();
