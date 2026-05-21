// ===== UI 文件: ui.js (最终稳定版，所有开关 + RuleManager) =====

function escapeHtml(str = "") {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function openMengPanel(context) {
    const { settings, extension_settings, saveSettingsDebounced, PLUGIN_ID } = context;
    if (!settings || typeof settings !== "object") {
        alert("⚠️ 设置尚未加载，请关闭面板后重试");
        return;
    }
    const extSettings = extension_settings || {};
    settings.nameFixRules = Array.isArray(settings.nameFixRules) ? settings.nameFixRules : [];
    settings.simpleReplacements = Array.isArray(settings.simpleReplacements) ? settings.simpleReplacements : [];
    settings.regexRules = Array.isArray(settings.regexRules) ? settings.regexRules : [];
    settings.contextRules = Array.isArray(settings.contextRules) ? settings.contextRules : [];
    if ($("#meng-overlay").length) return;

    const html = `
<div id="meng-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.65);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);">
    <div style="width:90%;max-width:520px;max-height:85vh;overflow:auto;background:#e6f4ea;border-radius:18px;padding:18px;color:#0f172a;box-shadow:0 0 25px rgba(0,0,0,0.5);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div style="font-size:1.2rem;font-weight:bold;">🐼 梦晏晨 · 文辞净斋</div>
            <div id="meng-close" style="cursor:pointer;font-size:1.2rem;">✕</div>
        </div>
        <hr>
        <div id="meng-content-container"></div>
    </div>
</div>`;

    $("body").append(html);
    const $overlay = $("#meng-overlay");
    const $content = $("#meng-content-container");
    $("#meng-close").on("click", () => $overlay.remove());

    $content.html(`
        <details open><summary style="font-weight:bold;color:#0f766e;cursor:pointer;">🥰 名字修正</summary>
            <div id="meng-namefix-container" style="margin-top:8px;"></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <input id="meng-namefix-new-from" placeholder="错误名" style="flex:1;">
                <input id="meng-namefix-new-to" placeholder="正确名" style="flex:1;">
                <button id="meng-namefix-add">➕</button>
            </div>
        </details>
        <details open><summary style="font-weight:bold;color:#f59e0b;cursor:pointer;">🥳 脏词/简单替换</summary>
            <div id="meng-simple-container" style="margin-top:8px;"></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <input id="meng-simple-new-from" placeholder="原词" style="flex:1;">
                <input id="meng-simple-new-to" placeholder="替换为(可选)" style="flex:1;">
                <button id="meng-simple-add">➕</button>
            </div>
        </details>
        <details open><summary style="font-weight:bold;color:#3b82f6;cursor:pointer;">😴 正则替换</summary>
            <div id="meng-regex-container" style="margin-top:8px;"></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <input id="meng-regex-new-pattern" placeholder="正则 pattern" style="flex:1;">
                <input id="meng-regex-new-replace" placeholder="替换为(可选)" style="flex:1;">
                <button id="meng-regex-add">➕</button>
            </div>
        </details>
        <details open><summary style="font-weight:bold;color:#f87171;cursor:pointer;">🍵 上下文删除</summary>
            <div id="meng-context-container" style="margin-top:8px;"></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <input id="meng-context-new" placeholder="待删除内容" style="flex:1;">
                <button id="meng-context-add">➕</button>
            </div>
        </details>
        <details open><summary style="font-weight:bold;color:#7c3aed;cursor:pointer;">🫠 实时预览</summary>
            <textarea id="meng-preview-input" placeholder="在此粘贴文本..." style="width:100%;height:60px;margin-top:8px;"></textarea>
            <button id="meng-preview-run" style="margin-top:4px;">▶ 预览清洗</button>
            <div id="meng-preview-output" style="background:#ffffff;border-radius:8px;padding:8px;margin-top:6px;white-space:pre-wrap;max-height:120px;overflow:auto;"></div>
            <div id="meng-preview-log" style="font-size:0.8rem;color:#475569;margin-top:4px;"></div>
            <div id="meng-pending-confirm" style="margin-top:4px;"></div>
        </details>
        <details><summary style="font-weight:bold;color:#0f172a;cursor:pointer;">😶‍🌫️ 实时日志</summary>
            <pre id="meng-live-log" style="background:#f1f5f9;border-radius:8px;padding:8px;max-height:150px;overflow:auto;font-size:0.8rem;margin-top:6px;"></pre>
        </details>
        <details open>
            <summary style="font-weight:bold;color:#0f172a;cursor:pointer;">⚙️ 保护与优化开关</summary>
            <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px;">
                <label style="cursor:pointer;">
                    <input type="checkbox" id="meng-protect-variables" ${settings.protectVariables ? 'checked' : ''}>
                    🥹 保护 {{user}} / {{char}} 变量
                </label>
                <label style="cursor:pointer;">
                    <input type="checkbox" id="meng-protect-whitelist" ${settings.protectWhitelist ? 'checked' : ''}>
                    🤔 保护 ST 白名单标签
                </label>
                <label style="cursor:pointer;">
                    <input type="checkbox" id="meng-protect-statusbar" ${settings.protectStatusBar ? 'checked' : ''}>
                    😫 保护状态栏/XML/中文标签
                </label>
                <label style="cursor:pointer;">
                    <input type="checkbox" id="meng-sentence-optimization" ${settings.enableSentenceOptimization ? 'checked' : ''}>
                    🧸 启用句子清理与自然段优化
                </label>
                <div style="margin-top:4px;">
                    <label style="font-size:0.9rem;">动作词列表（逗号分隔）：</label>
                    <input id="meng-action-words" type="text" style="width:100%;" value="${(settings.actionWords || []).join(',')}">
                </div>
            </div>
        </details>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;">
            <button id="meng-save">🧧 保存设置</button>
            <button id="meng-export">🍰 导出规则</button>
            <button id="meng-import">🧁 导入规则</button>
            <input type="file" id="meng-import-file" accept=".json" style="display:none;">
        </div>
    `);

    const $namefixContainer = $("#meng-namefix-container");
    const $simpleContainer = $("#meng-simple-container");
    const $regexContainer = $("#meng-regex-container");
    const $contextContainer = $("#meng-context-container");
    const $previewOutput = $("#meng-preview-output");
    const $previewLog = $("#meng-preview-log");
    const $pendingConfirm = $("#meng-pending-confirm");
    const $liveLog = $("#meng-live-log");

    function renderRuleList(container, rules, isSimple = false) {
        container.empty();
        if (!Array.isArray(rules)) return;
        rules.forEach((item, index) => {
            if (!item) return;
            if (typeof item === "string") rules[index] = item = { from: item, to: "", enabled: true };
            const text = item.from !== undefined
                ? `${escapeHtml(item.from)} → ${escapeHtml(item.to || '')}`
                : item.pattern
                    ? `${escapeHtml(item.pattern)} → ${escapeHtml(item.replace || '(删除)')}`
                    : escapeHtml(JSON.stringify(item));
            const row = $(`
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;padding:6px;background:#d9f0e8;border-radius:8px;">
                    <input type="checkbox" ${item.enabled ? 'checked' : ''}>
                    <span style="flex:1;color:${isSimple ? '#f59e0b' : '#0f766e'};word-break:break-all;font-size:0.92rem;">${text}</span>
                    <button class="meng-delete-rule" style="border:none;background:#ef4444;color:white;border-radius:6px;cursor:pointer;padding:2px 8px;">🗑</button>
                </div>`);
            row.find('input[type=checkbox]').on('change', function() {
                item.enabled = this.checked;
                saveSettingsDebounced();
            });
            row.find('.meng-delete-rule').on('click', () => {
                rules.splice(index, 1);
                renderRuleList(container, rules, isSimple);
                saveSettingsDebounced();
            });
            container.append(row);
        });
    }

    renderRuleList($namefixContainer, settings.nameFixRules);
    renderRuleList($simpleContainer, settings.simpleReplacements, true);
    renderRuleList($regexContainer, settings.regexRules);
    renderRuleList($contextContainer, settings.contextRules);

    // 添加规则事件
    $("#meng-namefix-add").on("click", () => {
        const from = $("#meng-namefix-new-from").val().trim();
        const to = $("#meng-namefix-new-to").val().trim();
        if (!from || !to) return alert("请填写错误名字和正确名字");
        settings.nameFixRules.push({ from, to, enabled: true });
        renderRuleList($namefixContainer, settings.nameFixRules);
        saveSettingsDebounced();
        $("#meng-namefix-new-from,#meng-namefix-new-to").val('');
    });
    $("#meng-simple-add").on("click", () => {
        const from = $("#meng-simple-new-from").val().trim();
        const to = $("#meng-simple-new-to").val().trim();
        if (!from) return alert("请填写要替换的原词");
        settings.simpleReplacements.push({ from, to, enabled: true });
        renderRuleList($simpleContainer, settings.simpleReplacements, true);
        saveSettingsDebounced();
        $("#meng-simple-new-from,#meng-simple-new-to").val('');
    });
    $("#meng-regex-add").on("click", () => {
        const pattern = $("#meng-regex-new-pattern").val().trim();
        const replace = $("#meng-regex-new-replace").val().trim();
        if (!pattern) return alert("请填写正则 pattern");
        settings.regexRules.push({ pattern, replace, enabled: true });
        renderRuleList($regexContainer, settings.regexRules);
        saveSettingsDebounced();
        $("#meng-regex-new-pattern,#meng-regex-new-replace").val('');
    });
    $("#meng-context-add").on("click", () => {
        const val = $("#meng-context-new").val().trim();
        if (!val) return alert("请填写上下文删除内容");
        settings.contextRules.push({ pattern: val, enabled: true });
        renderRuleList($contextContainer, settings.contextRules);
        saveSettingsDebounced();
        $("#meng-context-new").val('');
    });

    // 预览
    $("#meng-preview-run").on("click", async () => {
        const input = $("#meng-preview-input").val() || "";
        $previewOutput.text("正在清洗...");
        $previewLog.text("正在生成日志...");
        window.MengYanChen = window.MengYanChen || {};
        window.MengYanChen.pendingConfirmations = window.MengYanChen.pendingConfirmations || [];
        window.MengYanChen.correctNames = window.MengYanChen.correctNames || new Set();
        if (!window.MengCleaner?.cleanText) return alert("⚠️ MengCleaner 未就绪");
        let cleaned = "";
        try { cleaned = await window.MengCleaner.cleanText(input, settings); } catch { return alert("⚠️ 清洗失败"); }
        $pendingConfirm.empty();
        window.MengYanChen.pendingConfirmations.forEach(item => {
            const row = $(`<div style="margin-bottom:4px;">${escapeHtml(item.wrong)} → ${escapeHtml(item.correct)} <button style="margin-left:8px;">确认</button></div>`);
            row.find("button").on("click", () => {
                window.MengYanChen.correctNames.add(item.correct);
                window.MengYanChen.pendingConfirmations = window.MengYanChen.pendingConfirmations.filter(x => x !== item);
                row.remove();
            });
            $pendingConfirm.append(row);
        });
        $previewOutput.text(cleaned);
        $previewLog.html(`📝 名字修正 ${settings.nameFixRules.length}，脏词 ${settings.simpleReplacements.length}，正则 ${settings.regexRules.length}，上下文删除 ${settings.contextRules.length}`);
        $liveLog.append(`🕒 [${new Date().toLocaleTimeString()}] 🔍 本轮预览完成\n`);
        $liveLog.scrollTop($liveLog[0].scrollHeight);
    });

    // 保存
    $("#meng-save").on("click", () => {
        try {
            extSettings[PLUGIN_ID] = structuredClone(settings);
            saveSettingsDebounced();
            alert("💾 梦晏晨设置已保存");
        } catch (e) { alert("⚠️ 保存失败"); }
    });

    // 导出
    $("#meng-export").on("click", () => {
        const json = JSON.stringify(settings, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const a = document.createElement("a");
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = `梦晏晨-规则备份-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        alert("📂 规则已导出");
    });

    // 导入
    $("#meng-import").on("click", () => $("#meng-import-file").click());
    $("#meng-import-file").on("change", e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                let raw = reader.result;
                if (typeof raw === "string") raw = raw.replace(/^\uFEFF/, "").trim();
                const imported = JSON.parse(raw);
                settings.nameFixRules = Array.isArray(imported.nameFixRules) ? imported.nameFixRules : [];
                settings.simpleReplacements = Array.isArray(imported.simpleReplacements) ? imported.simpleReplacements : [];
                settings.regexRules = Array.isArray(imported.regexRules) ? imported.regexRules : [];
                settings.contextRules = Array.isArray(imported.contextRules) ? imported.contextRules : [];
                settings.nameFixRules = settings.nameFixRules.map(i => ({ enabled: true, ...i }));
                settings.simpleReplacements = settings.simpleReplacements.map(i => ({ enabled: true, ...i }));
                settings.regexRules = settings.regexRules.map(i => { delete i._regex; return { enabled: true, ...i }; });
                settings.contextRules = settings.contextRules.map(i => ({ enabled: true, ...i }));
                settings.regexRules.forEach(r => { try { r._regex = new RegExp(r.pattern, r.flags || "g"); } catch {} });
                extSettings[PLUGIN_ID] = JSON.parse(JSON.stringify(settings));
                saveSettingsDebounced();
                renderRuleList($namefixContainer, settings.nameFixRules);
                renderRuleList($simpleContainer, settings.simpleReplacements, true);
                renderRuleList($regexContainer, settings.regexRules);
                renderRuleList($contextContainer, settings.contextRules);
                alert("📥 导入成功！");
            } catch (err) { alert("⚠️ 导入失败：" + err.message); }
        };
        reader.readAsText(file);
        e.target.value = "";
    });

    // 开关事件
    $("#meng-protect-variables").on("change", function() { settings.protectVariables = this.checked; saveSettingsDebounced(); });
    $("#meng-protect-whitelist").on("change", function() { settings.protectWhitelist = this.checked; saveSettingsDebounced(); });
    $("#meng-protect-statusbar").on("change", function() { settings.protectStatusBar = this.checked; saveSettingsDebounced(); });
    $("#meng-sentence-optimization").on("change", function() { settings.enableSentenceOptimization = this.checked; saveSettingsDebounced(); });
    $("#meng-action-words").on("change", function() {
        const val = $(this).val().trim();
        settings.actionWords = val ? val.split(",").map(s => s.trim()).filter(Boolean) : [];
        saveSettingsDebounced();
    });

    // 日志折叠
    let logVisible = true;
    const $logToggle = $('<button id="meng-log-toggle" style="position:absolute;top:12px;right:18px;padding:4px 8px;font-size:0.9rem;border-radius:6px;border:none;background:#10b981;color:white;cursor:pointer;">📜 收起日志</button>');
    $overlay.find("> div").append($logToggle);
    $logToggle.on("click", () => {
        logVisible = !logVisible;
        $liveLog.toggle(logVisible);
        $logToggle.text(logVisible ? "📜 收起日志" : "📜 显示日志");
    });
}

// Panda 按钮
function injectPandaButton(context) {
    const target = $("#data_bank_wand_container");
    if (!target.length) { setTimeout(() => injectPandaButton(context), 500); return; }
    if ($("#meng-panda-btn").length) return;
    const btn = $(`<div id="meng-panda-btn" style="cursor:pointer;padding:6px 10px;border-radius:12px;background:rgba(0,128,0,0.15);display:flex;align-items:center;gap:6px;font-size:1rem;margin-top:4px;user-select:none;transition:background 0.25s;"><span>🐼</span><span>梦晏晨</span></div>`);
    btn.hover(
        () => btn.css("background", "rgba(0,128,0,0.25)"),
        () => btn.css("background", "rgba(0,128,0,0.15)")
    );
    btn.on("click", () => openMengPanel(context));
    target.append(btn);
    console.log("[梦晏晨] 🐼 Panda 按钮注入成功");
}

window.MengUI = window.MengUI || {};
window.MengUI.openMengPanel = openMengPanel;
window.MengUI.injectPandaButton = injectPandaButton;

// RuleManager 模块
(function() {
    let rules = [];
    const STORAGE_KEY = "meng_rule_manager_rules";
    const updateCallbacks = [];

    async function loadRules() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            rules = stored ? JSON.parse(stored) : [];
            restoreRegexCache();
        } catch (e) { rules = []; }
    }

    async function saveRules() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rules)); notifyUpdate(); return true; } catch { return false; } }

    async function addRule(rule) {
        if (!rule || typeof rule !== "object") return false;
        if (typeof rule.enabled !== "boolean") rule.enabled = true;
        if (!rule.id) rule.id = "meng_" + Date.now() + "_" + Math.random().toString(36).slice(2,8);
        rules.push(rule); await saveRules(); return true;
    }

    async function removeRule(id) {
        const len = rules.length;
        rules = rules.filter(r => r.id !== id);
        if (rules.length === len) return false;
        await saveRules(); return true;
    }

    async function updateRule(id, data) {
        const target = rules.find(r => r.id === id);
        if (!target) return false;
        Object.assign(target, data);
        if (target.type === "regex") try { target._regex = new RegExp(target.pattern, target.flags || "g"); } catch {}
        await saveRules(); return true;
    }

    async function toggleRule(id, enabled) {
        const target = rules.find(r => r.id === id);
        if (!target) return false;
        target.enabled = !!enabled; await saveRules(); return true;
    }

    async function clearRules(type) {
        if (!type) rules = [];
        else rules = rules.filter(r => r.type !== type);
        await saveRules();
    }

    function exportRules() {
        const blob = new Blob([JSON.stringify(rules, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        const url = URL.createObjectURL(blob);
        a.href = url; a.download = `梦晏晨规则备份_${new Date().toISOString().slice(0,10)}.json`;
        a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function importRules(json) {
        try {
            const imported = typeof json === "string" ? JSON.parse(json) : json;
            if (!Array.isArray(imported)) return false;
            imported.forEach(r => {
                if (r.type === "regex") try { r._regex = new RegExp(r.pattern, r.flags || "g"); } catch {}
                if (typeof r.enabled !== "boolean") r.enabled = true;
                if (!r.id) r.id = "meng_" + Date.now() + "_" + Math.random().toString(36).slice(2,8);
            });
            rules = imported; await saveRules(); return true;
        } catch { return false; }
    }

    function registerUpdateCallback(fn) { if (typeof fn === "function") updateCallbacks.push(fn); }

    function notifyUpdate() { updateCallbacks.forEach(fn => { try { fn(rules); } catch {} }); }

    function restoreRegexCache() {
        rules.forEach(r => { if (r.type === "regex" && !r._regex) try { r._regex = new RegExp(r.pattern, r.flags || "g"); } catch {} });
    }

    function syncUI() {
        if (!window.MengUI?.renderRuleList) return;
        window.MengUI.renderRuleList("#meng-namefix-container", rules.filter(r => r.type === "nameFix"));
        window.MengUI.renderRuleList("#meng-simple-container", rules.filter(r => r.type === "simple"), true);
        window.MengUI.renderRuleList("#meng-regex-container", rules.filter(r => r.type === "regex"));
        window.MengUI.renderRuleList("#meng-context-container", rules.filter(r => r.type === "context"));
    }

    async function initialize() { await loadRules(); notifyUpdate(); }

    setInterval(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rules)); } catch {} }, 1000 * 60 * 3);
    window.addEventListener("beforeunload", () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rules)); } catch {} });

    window.MengRuleManager = {
        addRule, removeRule, updateRule, toggleRule, clearRules,
        exportRules, importRules, registerUpdateCallback, syncUI,
        initialize, getRules: () => rules
    };
    initialize();
})();

window.addEventListener("error", e => { console.error("[梦晏晨] ❌ 全局错误", e.error); });
window.addEventListener("unhandledrejection", e => { console.error("[梦晏晨] ❌ Promise 错误", e.reason); });

console.log("[梦晏晨] ui.js 加载完成");