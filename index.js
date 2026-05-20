(async () => {
    console.log("[梦晏晨] 插件加载初始化");

    // ===== toast + 页面右下角日志 =====
    const liveLogContainer = document.createElement("div");
    liveLogContainer.id = "meng-live-toast-log";
    liveLogContainer.style.position = "fixed";
    liveLogContainer.style.bottom = "10px";
    liveLogContainer.style.right = "10px";
    liveLogContainer.style.width = "260px";
    liveLogContainer.style.maxHeight = "40vh";
    liveLogContainer.style.overflowY = "auto";
    liveLogContainer.style.background = "rgba(0,0,0,0.65)";
    liveLogContainer.style.color = "#fff";
    liveLogContainer.style.padding = "8px";
    liveLogContainer.style.borderRadius = "10px";
    liveLogContainer.style.fontSize = "0.85rem";
    liveLogContainer.style.zIndex = 999999;
    liveLogContainer.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";
    document.body.appendChild(liveLogContainer);

    function appendLiveLog(msg) {
        const line = document.createElement("div");
        line.textContent = `🕒 [${new Date().toLocaleTimeString()}] ${msg}`;
        liveLogContainer.appendChild(line);
        liveLogContainer.scrollTop = liveLogContainer.scrollHeight;
    }

    function showToast(message, duration = 2500) {
        appendLiveLog(message);
        const toast = document.createElement("div");
        toast.textContent = message;
        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.right = "20px";
        toast.style.background = "rgba(0,0,0,0.85)";
        toast.style.color = "white";
        toast.style.padding = "10px 14px";
        toast.style.borderRadius = "8px";
        toast.style.fontSize = "0.95rem";
        toast.style.zIndex = 999999;
        toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";
        toast.style.opacity = 0;
        toast.style.transition = "opacity 0.3s";
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.style.opacity = 1);
        setTimeout(() => {
            toast.style.opacity = 0;
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ===== 异步加载规则 =====
    async function initRules() {
        if (!window.MengRuleManager) {
            showToast("⚠️ RuleManager 未加载！");
            console.warn("[梦晏晨] RuleManager 未定义");
            return [];
        }
        appendLiveLog("🔄 开始加载 RuleManager 规则...");
        try {
            const rules = await window.MengRuleManager.loadRules();
            console.log("[梦晏晨] 规则已加载", rules);
            showToast("⚡ RuleManager 规则加载成功！");
            appendLiveLog("✅ RuleManager 规则加载完成");
            return rules;
        } catch(e) {
            console.error("[梦晏晨] 规则加载失败", e);
            showToast("⚠️ RuleManager 规则加载失败");
            appendLiveLog("❌ RuleManager 规则加载失败");
            return [];
        }
    }

    const rules = await initRules();

    // ===== 设置对象 =====
    let settings = {
        nameFixMap: {},
        simpleReplacements: [],
        regexRules: [],
        contextRules: [],
        nameFixRules: []
    };

    // ===== 规则映射 =====
    rules.forEach(r => {
        if (!r.enabled) return;
        switch(r.type){
            case "nameFix":
                settings.nameFixMap[r.from] = r.to;
                settings.nameFixRules.push({ from: r.from, to: r.to, enabled: true });
                break;
            case "simple":
                settings.simpleReplacements.push({ from: r.from, to: r.to, enabled: true });
                break;
            case "regex":
                settings.regexRules.push({
                    pattern: r.pattern,
                    replace: r.replace || "",
                    flags: r.flags || "g",
                    _regex: r._regex || new RegExp(r.pattern, r.flags || "g")
                });
                break;
            case "context":
                settings.contextRules.push(r);
                break;
        }
    });

    // ===== RuleManager 更新回调 =====
    window.MengRuleManager?.registerUpdateCallback?.((newRules) => {
        newRules.forEach(r => {
            if (!r.enabled) return;
            if (r.type === "nameFix") {
                settings.nameFixMap[r.from] = r.to;
                if (!settings.nameFixRules.find(e => e.from === r.from)) {
                    settings.nameFixRules.push({ from: r.from, to: r.to, enabled: true });
                }
            } else if (r.type === "simple") {
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
        showToast("⚡ RuleManager 已更新规则！");
        appendLiveLog("🔔 规则更新完成");
    });

    // ===== UI 挂载 & 按钮注入 =====
    window.MengUI = window.MengUI || {};
    window.MengUI.openMengPanel = window.MengUI.openMengPanel || (() => {});

    function injectPandaButton(context){
        const target = $("#data_bank_wand_container");
        if (!target.length) {
            appendLiveLog("⏳ 容器未就绪，等待注入按钮...");
            setTimeout(() => injectPandaButton(context), 1000);
            return;
        }
        if ($("#meng-panda-btn").length) return;
        const btn = $(`
<div id="meng-panda-btn" style="cursor:pointer;padding:6px 10px;border-radius:12px;background:rgba(255,255,255,0.08);display:flex;align-items:center;gap:6px;font-size:1rem;margin-top:4px;">
<span>🐼</span><span>梦晏晨</span>
</div>`);
        btn.on("click", () => {
            if (typeof window.MengUI.openMengPanel === 'function') {
                window.MengUI.openMengPanel(context);
                showToast("✅ 面板已打开");
                appendLiveLog("📂 面板打开成功");
            } else {
                alert("⚠️ 面板未就绪");
                console.error("[梦晏晨] openMengPanel 未定义");
            }
        });
        target.append(btn);
        console.log("[梦晏晨] 🐼 Panda按钮已注入");
        showToast("🐼 Panda按钮注入成功");
        appendLiveLog("🐼 Panda按钮注入完成");
    }
    window.MengUI.injectPandaButton = injectPandaButton;

    // ===== 全局状态管理 =====
    window.MengYanChen = window.MengYanChen || {};
    window.MengYanChen.correctNames = window.MengYanChen.correctNames || new Set(['林晨','谢知许','洛君瑾']);
    window.MengYanChen.pendingConfirmations = window.MengYanChen.pendingConfirmations || [];

    function processMessage(msg, messageId){
        if (!window.MengCleaner || !msg || (!msg.mes && !msg.content) || msg._meng_cleaned) return;
        const field = msg.mes ? "mes" : "content";
        let cleaned;
        try { cleaned = window.MengCleaner.cleanText(msg[field], settings); }
        catch(e) { 
            console.error("[梦晏晨] cleanText 出错", e, msg); 
            showToast("⚠️ 消息清洗出错"); 
            appendLiveLog("❌ 消息清洗失败"); 
            return; 
        }
        if (cleaned !== msg[field]){
            msg[field] = cleaned;
            msg._meng_cleaned = true;
            const chat = window.SillyTavern?.getContext?.()?.chat;
            if (chat?.[messageId]) { chat[messageId][field] = cleaned; chat[messageId]._meng_cleaned = true; }
            const mesBlock = document.querySelector(`#chat .mes[mesid="${messageId}"] .mes_text`);
            if (mesBlock) mesBlock.textContent = cleaned;
            appendLiveLog(`✅ 消息 [${messageId}] 已清洗`);
        }
    }

    window.MengUI.processMessageWithLearning = window.MengUI.processMessageWithLearning || ((msg,id) => {
        try { processMessage(msg,id); } catch(e){ 
            console.error(e); 
            showToast("⚠️ 消息处理异常"); 
        }
    });

    // ===== 注入按钮 & 绑定事件 =====
    function tryInjectPanda(context){
        const container = $("#data_bank_wand_container");
        if (!container.length) { 
            appendLiveLog("⏳ UI容器未就绪，等待重试...");
            setTimeout(() => tryInjectPanda(context), 500); 
            return; 
        }
        if ($("#meng-panda-btn").length) return;
        window.MengUI.injectPandaButton(context);
        appendLiveLog("🎉 UI按钮注入完成");
    }

    function bindEvents(){
        const context = window.SillyTavern?.getContext?.();
        if (!context?.eventSource) { 
            appendLiveLog("⏳ ST context未就绪，等待事件绑定...");
            setTimeout(bindEvents,500); 
            return; 
        }
        if (context._meng_bound) return;
        context._meng_bound = true;
        const bindEvent = (eventType) => context.eventSource.on(eventType,(...args)=>{
            const messageId = Number(args?.[0]);
            const msg = context.chat?.[messageId];
            if(msg) processMessage(msg,messageId);
        });
        bindEvent(context.event_types.CHARACTER_MESSAGE_RENDERED);
        bindEvent(context.event_types.USER_MESSAGE_RENDERED);
        console.log("[梦晏晨] 消息事件绑定完成 ✅");
        appendLiveLog("🎯 消息监听已开启");
        showToast("🎯 消息监听已开启");
    }

    if (!window.__ST_IMPORT_EXPORT_MODE__) {
        $(document).ready(()=>{
            appendLiveLog("🚀 插件已启动");
            showToast("🚀 梦晏晨插件已启动");
            tryInjectPanda({ settings, extension_settings: window.extension_settings || {}, saveSettingsDebounced: ()=>{}, PLUGIN_ID: 'meng' });
            bindEvents();
        });
    }

})();