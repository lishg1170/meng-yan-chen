// ===== UI 文件: ui.js (可爱？版求别崩溃) =====

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
                    ε(´｡•᎑•`)っ♡ 启用句子清理与自然段优化
                </label>
                <div style="margin-top:4px;">
                    <label style="font-size:0.9rem;">动作词列表（逗号分隔）：</label>
                    <input id="meng-action-words" type="text" style="width:100%;" value="${(settings.actionWords || []).join(',')}">
                </div>
            </div>
        </details>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;">
            <button id="meng-save">🧧 保存设置</button>
            <button id="meng-export">૮⸝⸝o̴̶̷᷄ ·̭ o̴̶̷̥᷅⸝⸝ა 导出规则</button>
            <button id="meng-import">₍ᐢ⸝⸝› ̫‹⸝⸝ᐢ₎❤️‍🩹 导入规则</button>
            <input type="file" id="meng-import-file" accept=".json" style="display:none;">
        </div>
    `);

    // 绑定所有事件（同之前，但增加新增开关的事件）
    // ... 名字修正、简单替换、正则、上下文删除的添加事件
    // ... 预览、保存、导入导出事件

    // 新增开关事件
    $("#meng-protect-variables").on("change", function() {
        settings.protectVariables = this.checked;
        saveSettingsDebounced();
    });
    $("#meng-protect-whitelist").on("change", function() {
        settings.protectWhitelist = this.checked;
        saveSettingsDebounced();
    });
    $("#meng-protect-statusbar").on("change", function() {
        settings.protectStatusBar = this.checked;
        saveSettingsDebounced();
    });
    $("#meng-sentence-optimization").on("change", function() {
        settings.enableSentenceOptimization = this.checked;
        saveSettingsDebounced();
    });
    $("#meng-action-words").on("change", function() {
        const val = $(this).val().trim();
        if (val) {
            settings.actionWords = val.split(",").map(s => s.trim()).filter(Boolean);
        } else {
            settings.actionWords = [];
        }
        saveSettingsDebounced();
    });

    // ... 其余日志折叠等事件

    // 初始化渲染
    renderRuleList($namefixContainer, settings.nameFixRules);
    renderRuleList($simpleContainer, settings.simpleReplacements, true);
    renderRuleList($regexContainer, settings.regexRules);
    renderRuleList($contextContainer, settings.contextRules);
}

// ... injectPandaButton 和 RuleManager 保持不变（但需确保 RuleManager 包含完整方法）
// 此处为节省篇幅省略，你仓库里现有的 ui.js 末尾的 RuleManager 模块可以继续用，只要把开关部分和表情替换成上面的即可。