(async () => {
    console.log("[梦晏晨] 插件加载初始化...");

    // ===== 弹窗 + 页面日志提示 =====
    function showToast(msg) {
        alert(msg);
        appendLiveLog(msg);
    }

    function appendLiveLog(msg) {
        const $log = $("#meng-live-log");
        if ($log.length) {
            $log.append(`🕒 [${new Date().toLocaleTimeString()}] ${msg}\n`);
            $log.scrollTop($log[0].scrollHeight);
        }
        console.log("[梦晏晨]", msg);
    }

    // ===== 异步加载规则 =====
    async function initRules() {
        if (!window.MengRuleManager) {
            appendLiveLog("⚠️ RuleManager 未加载，使用默认规则");
            return [];
        }
        try {
            const rules = await window.MengRuleManager.loadRules();
            appendLiveLog(`✅ 规则已加载，条数：${rules.length}`);
            return rules;
        } catch(e) {
            console.error("[梦晏晨] 规则加载失败", e);
            appendLiveLog("⚠️ 规则加载失败，使用默认规则");
            return [];
        }
    }

    const loadedRules = await initRules();

    // ===== 初始化设置 =====
    let settings = {
        nameFixMap: {},
        simpleReplacements: [],
        regexRules: [],
        contextRules: [],
    };

    loadedRules.forEach(r => {
        if (!r.enabled) return;
        switch(r.type) {
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

    appendLiveLog("✅ 初始规则映射完成");

    // ===== RuleManager 更新回调 =====
    window.MengRuleManager?.registerUpdateCallback?.((newRules) => {
        newRules.forEach(r => {
            if (!r.enabled) return;
            if (r.type === "nameFix") settings.nameFixMap[r.from] = r.to;
            else if (r.type === "simple") {
                if (!settings.simpleReplacements.find(e => e.from === r.from))
                    settings.simpleReplacements.push({ from: r.from, to: r.to, enabled: true });
            } else if (r.type === "regex") {
                if (!settings.regexRules.find(e => e.pattern === r.pattern))
                    settings.regexRules.push({
                        pattern: r.pattern,
                        replace: r.replace || "",
                        flags: r.flags || "g",
                        _regex: r._regex || new RegExp(r.pattern, r.flags || "g")
                    });
            }
        });
        appendLiveLog("🔄 RuleManager 更新完成，settings 已同步");
    });

    // ===== 安全挂载 UI 模块 =====
    window.MengUI = window.MengUI || {};
    window.MengUI.openMengPanel = window.MengUI.openMengPanel || (() => {});
    function injectPandaButton(context) {
        const target = $("#data_bank_wand_container");
        if (!target.length) { setTimeout(() => injectPandaButton(context), 500); return; }
        if ($("#meng-panda-btn").length) return;

        const btn = $(`
<div id="meng-panda-btn" style="cursor:pointer;padding:6px 10px;border-radius:12px;background:rgba(255,255,255,0.08);display:flex;align-items:center;gap:6px;font-size:1rem;margin-top:4px;">
<span>🐼</span><span>梦晏晨</span>
</div>`);
        btn.off("click").on("click", () => {
            window.MengUI.openMengPanel(context);
            showToast("✅ 梦晏晨 UI 已打开");
        });
        target.append(btn);
        appendLiveLog("✅ Panda 按钮注入成功");
        showToast("🐼 Panda 按钮已就绪，点击可打开 UI");
    }

    window.MengUI.injectPandaButton = window.MengUI.injectPandaButton || injectPandaButton;

    // ===== 持久化 + 默认设置 =====
    const PLUGIN_ID = "meng-yan-chen";
    const context = window.SillyTavern?.getContext?.();
    const extension_settings = context?.extension_settings || {};
    const saveSettingsDebounced = context?.saveSettingsDebounced || (() => { appendLiveLog("⚠️ saveSettingsDebounced 未定义") });

    const defaultSettings = {
        nameFixMap: { "林晟": "林晨", "林辰": "林晨" },
        simpleReplacements: [{ from: "眸子", to: "眼睛", enabled: true }],
        regexRules: [],
        contextRules: []
    };

    // ===== 读取已保存设置 =====
    settings = Object.assign({}, defaultSettings, extension_settings[PLUGIN_ID] || {}, settings);

    // ===== 正则预编译 =====
    if (Array.isArray(settings.regexRules)) {
        settings.regexRules.forEach(rule => { 
            if (!rule._regex && rule.pattern) {
                try { rule._regex = new RegExp(rule.pattern, rule.flags || "g"); } 
                catch(e) { appendLiveLog(`⚠️ 无效正则规则: ${rule.pattern}`); }
            }
        });
    }

    extension_settings[PLUGIN_ID] = settings;
    appendLiveLog("✅ 设置已初始化并持久化");

    // ===== 全局管理 pendingConfirmations / correctNames =====
    window.MengYanChen = window.MengYanChen || {};
    window.MengYanChen.correctNames = window.MengYanChen.correctNames || new Set(['林晨','谢知许','洛君瑾']);
    window.MengYanChen.pendingConfirmations = window.MengYanChen.pendingConfirmations || [];
    appendLiveLog("✅ 全局状态管理初始化完成");

    // ===== 消息处理函数 =====
    function processMessage(msg, messageId) {
        if (!window.MengCleaner || !msg || (!msg.mes && !msg.content) || msg._meng_cleaned) return;
        const field = msg.mes ? "mes" : "content";
        let cleaned;
        try {
            cleaned = window.MengCleaner.cleanText(msg[field], settings);
        } catch(e) {
            console.error("[梦晏晨] cleanText 出错", e, msg);
            appendLiveLog("⚠️ 清洗失败");
            return;
        }
        if (cleaned !== msg[field]) {
            msg[field] = cleaned;
            msg._meng_cleaned = true;
            const chat = window.SillyTavern?.getContext?.()?.chat;
            if (chat?.[messageId]) { chat[messageId][field] = cleaned; chat[messageId]._meng_cleaned = true; }
            const mesBlock = document.querySelector(`#chat .mes[mesid="${messageId}"] .mes_text`);
            if (mesBlock) mesBlock.textContent = cleaned;
            appendLiveLog(`✅ 消息 ${messageId} 已清洗`);
        }
    }

    // ===== 安全挂载 processMessageWithLearning =====
    if (!window.MengUI.processMessageWithLearning) {
        window.MengUI.processMessageWithLearning = (msg,id) => {
            try { processMessage(msg,id); } catch(e){ appendLiveLog(`⚠️ processMessageWithLearning 错误: ${e}`); }
        };
    }

    // ===== 延迟注入 Panda 按钮 =====
    function tryInjectPanda(context) {
        const container = $("#data_bank_wand_container");
        if (!container.length) { setTimeout(() => tryInjectPanda(context), 500); return; }
        if ($("#meng-panda-btn").length) return;
        window.MengUI.injectPandaButton(context);
    }

    // ===== 事件绑定 =====
    function bindEvents() {
        const context = window.SillyTavern?.getContext?.();
        if (!context?.eventSource) { setTimeout(bindEvents, 500); return; }
        if (context._meng_bound) return;
        context._meng_bound = true;

        appendLiveLog("✅ 开始监听消息");

        const bindEvent = (eventType) => {
            context.eventSource.on(eventType, (...args) => {
                const messageId = Number(args?.[0]);
                const msg = context.chat?.[messageId];
                if (msg) processMessage(msg, messageId);
            });
        };

        bindEvent(context.event_types.CHARACTER_MESSAGE_RENDERED);
        bindEvent(context.event_types.USER_MESSAGE_RENDERED);
    }

    if (!window.__ST_IMPORT_EXPORT_MODE__) {
        $(document).ready(()=>{
            appendLiveLog("✅ 插件启动完成，尝试注入 Panda 按钮...");
                        tryInjectPanda({ settings });
            bindEvents();
            appendLiveLog("✅ Panda 按钮注入与事件绑定完成");
            showToast("🎉 梦晏晨 插件已成功启动");
        });
    }

    // ===== 保存设置按钮挂载 =====
    function setupSaveButton() {
        const context = window.SillyTavern?.getContext?.();
        if (!context) { setTimeout(setupSaveButton, 500); return; }

        const saveBtn = $("#meng-save");
        if (!saveBtn.length) { setTimeout(setupSaveButton, 500); return; }

        saveBtn.off("click").on("click", () => {
            try {
                extension_settings[PLUGIN_ID] = structuredClone(settings);
                saveSettingsDebounced();
                appendLiveLog("💾 设置已保存到 extension_settings，刷新后依旧生效");
                showToast("✅ 梦晏晨设置已保存并持久化");
            } catch (e) {
                console.error(e);
                appendLiveLog("⚠️ 保存设置失败");
                alert("⚠️ 保存失败");
            }
        });
    }

    setupSaveButton();

    // ===== UI 打开后提示 =====
    window.MengUI.openMengPanel = function(context) {
        if (typeof window.MengUI._panelOpened === "undefined") window.MengUI._panelOpened = false;
        if (!window.MengUI._panelOpened) {
            window.MengUI._panelOpened = true;
            appendLiveLog("🖥️ UI 面板已打开");
            showToast("🖥️ 梦晏晨 UI 打开成功，可以进行规则编辑与清洗预览");
        }
        // 调用原本 UI 逻辑（你原有 openMengPanel 函数）
        try {
            if (typeof window.originalOpenMengPanel === "function") {
                window.originalOpenMengPanel(context);
            } else {
                appendLiveLog("⚠️ originalOpenMengPanel 未定义");
            }
        } catch (e) {
            appendLiveLog(`⚠️ 打开 UI 出错: ${e}`);
        }
    };
    
    // ===== 日志可收起按钮 =====
(function setupLogToggle() {
    const $liveLog = $("#meng-live-log");
    if (!$liveLog.length) { setTimeout(setupLogToggle, 500); return; }

    // 在面板顶部加按钮
    const $logToggleBtn = $(`
        <button id="meng-log-toggle" style="
            position: absolute;
            top: 12px;
            right: 18px;
            padding: 4px 8px;
            font-size: 0.9rem;
            border-radius: 6px;
            border: none;
            background: #8b5cf6;
            color: white;
            cursor: pointer;
        ">📜 收起日志</button>
    `);

    $("#meng-overlay > div").append($logToggleBtn);

    let logVisible = true;
    $logToggleBtn.on("click", () => {
        logVisible = !logVisible;
        $liveLog.toggle(logVisible);
        $logToggleBtn.text(logVisible ? "📜 收起日志" : "📜 显示日志");
        appendLiveLog(`📝 日志已${logVisible ? "显示" : "隐藏"}`);
    });

    // ===== 完整日志提示 =====
    appendLiveLog("🚀 梦晏晨插件初始化完成，所有模块已就绪 ✅");
})();