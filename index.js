(async () => {
    console.log("[梦晏晨] 插件加载初始化");

    // ===== 异步等待 RuleManager 加载规则 =====
    async function initRules() {
        if (!window.MengRuleManager) return [];
        try {
            const rules = await window.MengRuleManager.loadRules();
            console.log("[梦晏晨] 规则已加载", rules);
            return rules;
        } catch(e) {
            console.error("[梦晏晨] 规则加载失败", e);
            return [];
        }
    }

    // ===== 初始化规则 =====
    const rules = await initRules();

    // ===== 设置对象 =====
    let settings = {
        nameFixMap: {},
        simpleReplacements: [],
        regexRules: [],
        contextRules: []
    };

    // ===== 规则映射 =====
    rules.forEach(r => {
        if (!r.enabled) return;
        switch(r.type){
            case "nameFix": settings.nameFixMap[r.from] = r.to; break;
            case "simple": settings.simpleReplacements.push({ from: r.from, to: r.to, enabled: true }); break;
            case "regex": 
                settings.regexRules.push({
                    pattern: r.pattern,
                    replace: r.replace || "",
                    flags: r.flags || "g",
                    _regex: r._regex || new RegExp(r.pattern, r.flags || "g")
                });
                break;
            case "context": settings.contextRules.push(r); break;
        }
    });

    // ===== 规则更新回调 =====
    window.MengRuleManager?.registerUpdateCallback?.((newRules) => {
        newRules.forEach(r => {
            if (!r.enabled) return;
            if (r.type === "nameFix") settings.nameFixMap[r.from] = r.to;
            else if (r.type === "simple") {
                if (!settings.simpleReplacements.find(e => e.from === r.from)) {
                    settings.simpleReplacements.push({ from: r.from, to: r.to, enabled: true });
                }
            } else if (r.type === "regex") {
                if (!settings.regexRules.find(e => e.pattern === r.pattern)) {
                    settings.regexRules.push({
                        pattern: r.pattern,
                        replace: r.replace || "",
                        flags: r.flags || "g",
                        _regex: r._regex || new RegExp(r.pattern, r.flags || "g")
                    });
                }
            }
        });
        console.log("[梦晏晨] settings 已同步更新 ✅");
        showTip("规则已更新 ✅");
    });

    // ===== UI 挂载 =====
    window.MengUI = window.MengUI || {};
    // 确保 openMengPanel 不为空，提供默认面板提示
    window.MengUI.openMengPanel = window.MengUI.openMengPanel || ((context) => {
        showTip("梦晏晨面板打开！⚡（这是默认提示，可替换成真正UI）");
        console.log("[梦晏晨] 打开面板（默认提示）", context);
    });

    function injectPandaButton(context){
        const target = $("#data_bank_wand_container");
        if (!target.length) {
            console.warn("[梦晏晨] Panda 按钮容器未找到，等待重试...");
            setTimeout(() => injectPandaButton(context), 500);
            return;
        }
        if ($("#meng-panda-btn").length) return;
        const btn = $(`
<div id="meng-panda-btn" style="cursor:pointer;padding:6px 10px;border-radius:12px;background:rgba(255,255,255,0.08);display:flex;align-items:center;gap:6px;font-size:1rem;margin-top:4px;">
<span>🐼</span><span>梦晏晨</span>
</div>`);
        btn.off("click").on("click", () => window.MengUI.openMengPanel(context));
        target.append(btn);
        console.log("[梦晏晨] 🐼 Panda 按钮已成功注入");
        showTip("🐼 梦晏晨插件已加载 ✅");
    }
    window.MengUI.injectPandaButton = injectPandaButton;

    // ===== 全局管理 =====
    window.MengYanChen = window.MengYanChen || {};
    window.MengYanChen.correctNames = window.MengYanChen.correctNames || new Set(['林晨','谢知许','洛君瑾']);
    window.MengYanChen.pendingConfirmations = window.MengYanChen.pendingConfirmations || [];

    // ===== 消息处理 =====
    function processMessage(msg, messageId){
        if (!window.MengCleaner || !msg || (!msg.mes && !msg.content) || msg._meng_cleaned) return;
        const field = msg.mes ? "mes" : "content";
        let cleaned;
        try { cleaned = window.MengCleaner.cleanText(msg[field], settings); }
        catch(e) { console.error("[梦晏晨] cleanText 出错", e, msg); return; }
        if (cleaned !== msg[field]){
            msg[field] = cleaned;
            msg._meng_cleaned = true;
            const chat = window.SillyTavern?.getContext?.()?.chat;
            if (chat?.[messageId]) { chat[messageId][field] = cleaned; chat[messageId]._meng_cleaned = true; }
            const mesBlock = document.querySelector(`#chat .mes[mesid="${messageId}"] .mes_text`);
            if (mesBlock) mesBlock.textContent = cleaned;
        }
    }

    // ===== 安全挂载消息处理 =====
    window.MengUI.processMessageWithLearning = window.MengUI.processMessageWithLearning || ((msg,id) => {
        try { processMessage(msg,id); } catch(e){ console.error("[梦晏晨] processMessageWithLearning 错误", e); }
    });

    // ===== 延迟注入按钮 =====
    function tryInjectPanda(context){
        const container = $("#data_bank_wand_container");
        if (!container.length) { setTimeout(() => tryInjectPanda(context), 500); return; }
        if ($("#meng-panda-btn").length) return;
        window.MengUI.injectPandaButton(context);
    }

    // ===== 事件绑定 =====
    function bindEvents(){
        const context = window.SillyTavern?.getContext?.();
        if (!context?.eventSource) { setTimeout(bindEvents,500); return; }
        if (context._meng_bound) return;
        context._meng_bound = true;
        const bindEvent = (eventType) => context.eventSource.on(eventType,(...args)=>{
            const messageId = Number(args?.[0]);
            const msg = context.chat?.[messageId];
            if(msg) processMessage(msg,messageId);
        });
        bindEvent(context.event_types.CHARACTER_MESSAGE_RENDERED);
        bindEvent(context.event_types.USER_MESSAGE_RENDERED);
        console.log("[梦晏晨] 已绑定消息事件");
        showTip("🐼 消息监听已启动 ✅");
    }

    // ===== 小工具：页面提示 =====
    function showTip(text, duration=3000){
        let tip = $("#meng-tip");
        if(!tip.length){
            tip = $('<div id="meng-tip" style="position:fixed;top:10px;right:10px;padding:10px 15px;background:rgba(0,0,0,0.7);color:white;font-size:0.9rem;border-radius:8px;z-index:999999;">'+text+'</div>');
            $("body").append(tip);
        } else {
            tip.text(text).stop(true,true).fadeIn();
        }
        tip.stop(true,true).fadeIn().delay(duration).fadeOut();
    }

    // ===== 初始化入口 =====
    if (!window.__ST_IMPORT_EXPORT_MODE__) {
        $(document).ready(()=>{
            console.log("[梦晏晨] 插件已启动");
            showTip("🐼 梦晏晨插件初始化中...");
            tryInjectPanda({ settings });
            bindEvents();
        });
    }

})();