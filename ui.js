// ===== UI 文件: ui.js (完整修复版) =====

// ================== 工具函数 ==================
function escapeHtml(str = "") {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ================== 面板核心 ==================
function openMengPanel(context) {
    const { settings, extension_settings, saveSettingsDebounced, PLUGIN_ID } = context;

    // 确保数组存在
    settings.nameFixRules = Array.isArray(settings.nameFixRules) ? settings.nameFixRules : [];
    settings.simpleReplacements = Array.isArray(settings.simpleReplacements) ? settings.simpleReplacements : [];
    settings.regexRules = Array.isArray(settings.regexRules) ? settings.regexRules : [];
    settings.contextRules = Array.isArray(settings.contextRules) ? settings.contextRules : [];

    if ($("#meng-overlay").length) return;

    const html = `
<div id="meng-overlay" style="
    position:fixed; top:0; left:0; width:100%; height:100%;
    background:rgba(0,0,0,0.65); z-index:999999;
    display:flex; align-items:center; justify-content:center;
    backdrop-filter:blur(6px);
">
    <div style="
        width:90%; max-width:520px; max-height:85vh; overflow:auto;
        background:#e6f4ea; border-radius:18px; padding:18px;
        color:#0f172a; box-shadow:0 0 25px rgba(0,0,0,0.5);
    ">
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

    // 关闭按钮
    $("#meng-close").on("click", () => $overlay.remove());

    // 动态构建内容并绑定事件
    $content.html(`
        <!-- 名字修正 -->
        <details open>
            <summary style="font-weight:bold;color:#0f766e;cursor:pointer;">🔤 名字修正</summary>
            <div id="meng-namefix-container" style="margin-top:8px;"></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <input id="meng-namefix-new-from" placeholder="错误名" style="flex:1;">
                <input id="meng-namefix-new-to" placeholder="正确名" style="flex:1;">
                <button id="meng-namefix-add">➕</button>
            </div>
        </details>
        <!-- 简单替换 -->
        <details open>
            <summary style="font-weight:bold;color:#f59e0b;cursor:pointer;">📝 脏词/简单替换</summary>
            <div id="meng-simple-container" style="margin-top:8px;"></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <input id="meng-simple-new-from" placeholder="原词" style="flex:1;">
                <input id="meng-simple-new-to" placeholder="替换为(可选)" style="flex:1;">
                <button id="meng-simple-add">➕</button>
            </div>
        </details>
        <!-- 正则 -->
        <details open>
            <summary style="font-weight:bold;color:#3b82f6;cursor:pointer;">🔍 正则替换</summary>
            <div id="meng-regex-container" style="margin-top:8px;"></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <input id="meng-regex-new-pattern" placeholder="正则 pattern" style="flex:1;">
                <input id="meng-regex-new-replace" placeholder="替换为(可选)" style="flex:1;">
                <button id="meng-regex-add">➕</button>
            </div>
        </details>
        <!-- 上下文删除 -->
        <details open>
            <summary style="font-weight:bold;color:#f87171;cursor:pointer;">🗑️ 上下文删除</summary>
            <div id="meng-context-container" style="margin-top:8px;"></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <input id="meng-context-new" placeholder="待删除内容" style="flex:1;">
                <button id="meng-context-add">➕</button>
            </div>
        </details>
        <!-- 预览区域 -->
        <details open>
            <summary style="font-weight:bold;color:#7c3aed;cursor:pointer;">🔬 实时预览</summary>
            <textarea id="meng-preview-input" placeholder="在此粘贴文本..." style="width:100%;height:60px;margin-top:8px;"></textarea>
            <button id="meng-preview-run" style="margin-top:4px;">▶ 预览清洗</button>
            <div id="meng-preview-output" style="background:#ffffff;border-radius:8px;padding:8px;margin-top:6px;white-space:pre-wrap;max-height:120px;overflow:auto;"></div>
            <div id="meng-preview-log" style="font-size:0.8rem;color:#475569;margin-top:4px;"></div>
            <div id="meng-pending-confirm" style="margin-top:4px;"></div>
        </details>
        <!-- 实时日志 -->
        <details>
            <summary style="font-weight:bold;color:#0f172a;cursor:pointer;">📜 实时日志</summary>
            <pre id="meng-live-log" style="background:#f1f5f9;border-radius:8px;padding:8px;max-height:150px;overflow:auto;font-size:0.8rem;margin-top:6px;"></pre>
        </details>
        <!-- 操作栏 -->
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;">
            <button id="meng-save">💾 保存设置</button>
            <button id="meng-export">📤 导出规则</button>
            <button id="meng-import">📥 导入规则</button>
            <input type="file" id="meng-import-file" accept=".json" style="display:none;">
        </div>
    `);

    // 获取各个容器和元素
    const $namefixContainer = $("#meng-namefix-container");
    const $simpleContainer = $("#meng-simple-container");
    const $regexContainer = $("#meng-regex-container");
    const $contextContainer = $("#meng-context-container");
    const $previewOutput = $("#meng-preview-output");
    const $previewLog = $("#meng-preview-log");
    const $pendingConfirm = $("#meng-pending-confirm");
    const $liveLog = $("#meng-live-log");

    // 渲染列表函数
    function renderRuleList(container, rules, isSimple = false) {
        container.empty();
        if (!Array.isArray(rules)) return;

        rules.forEach((item, index) => {
            if (!item) return;
            if (typeof item === "string") {
                rules[index] = item = { from: item, to: "", enabled: true };
            }

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

            row.find('input[type=checkbox]').on('change', function () {
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

    // 初始渲染
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

    // 预览功能
    $("#meng-preview-run").on("click", async () => {
        const input = $("#meng-preview-input").val() || "";
        $previewOutput.text("正在清洗...");
        $previewLog.text("正在生成日志...");

        window.MengYanChen = window.MengYanChen || {};
        window.MengYanChen.pendingConfirmations = window.MengYanChen.pendingConfirmations || [];
        window.MengYanChen.correctNames = window.MengYanChen.correctNames || new Set();

        if (!window.MengCleaner || typeof window.MengCleaner.cleanText !== 'function') {
            alert("⚠️ MengCleaner 未就绪，请稍后重试");
            return;
        }

        let cleanedText = "";
        try {
            cleanedText = await window.MengCleaner.cleanText(input, settings);
        } catch (err) {
            console.error("[梦晏晨] 清洗失败", err);
            alert("⚠️ 清洗执行失败");
            return;
        }

        $pendingConfirm.empty();
        window.MengYanChen.pendingConfirmations.forEach(item => {
            const row = $(`
                <div style="margin-bottom:4px;">
                    ${escapeHtml(item.wrong)} → ${escapeHtml(item.correct)}
                    <button style="margin-left:8px;">确认</button>
                </div>
            `);
            row.find("button").on("click", () => {
                window.MengYanChen.correctNames.add(item.correct);
                window.MengYanChen.pendingConfirmations = window.MengYanChen.pendingConfirmations.filter(x => x !== item);
                row.remove();
            });
            $pendingConfirm.append(row);
        });

        $previewOutput.text(cleanedText);
        $previewLog.html(`
            📝 本轮清洗日志：
            <span style="color:#0f766e;">名字修正 ${(settings.nameFixRules || []).length}</span>，
            <span style="color:#f59e0b;">脏词 ${settings.simpleReplacements.length}</span>，
            <span style="color:#3b82f6;">正则 ${settings.regexRules.length}</span>，
            <span style="color:#f87171;">上下文删除 ${settings.contextRules.length}</span>
        `);
        $liveLog.append(`🕒 [${new Date().toLocaleTimeString()}] 🔍 本轮预览完成\n`);
        $liveLog.scrollTop($liveLog[0].scrollHeight);
    });

    // 保存设置
    $("#meng-save").on("click", () => {
        try {
            extension_settings[PLUGIN_ID] = structuredClone(settings);
            saveSettingsDebounced();
            alert("💾 梦晏晨设置已保存");
            $liveLog.append(`🕒 [${new Date().toLocaleTimeString()}] 💾 设置已保存\n`);
            $liveLog.scrollTop($liveLog[0].scrollHeight);
        } catch (err) {
            console.error(err);
            alert("⚠️ 保存失败");
        }
    });

    // 导出规则
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

    // 导入规则
    $("#meng-import").on("click", () => {
        $("#meng-import-file").click();
    });

    $("#meng-import-file").on("change", e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const imported = JSON.parse(reader.result);
                if (typeof imported !== "object" || imported === null) throw new Error("无效配置");

                settings.nameFixRules = (Array.isArray(imported.nameFixRules) ? imported.nameFixRules : []).map(i => ({ enabled:true, ...i }));
                settings.simpleReplacements = (Array.isArray(imported.simpleReplacements) ? imported.simpleReplacements : []).map(i => ({ enabled:true, ...i }));
                settings.regexRules = (Array.isArray(imported.regexRules) ? imported.regexRules : []).map(i => ({ enabled:true, ...i }));
                settings.contextRules = (Array.isArray(imported.contextRules) ? imported.contextRules : []).map(i => ({ enabled:true, ...i }));

                settings.regexRules.forEach(rule => {
                    try { rule._regex = new RegExp(rule.pattern, rule.flags || "g"); } 
                    catch(err) { console.warn("[梦晏晨] regex 编译失败:", rule.pattern); }
                });

                extension_settings[PLUGIN_ID] = JSON.parse(JSON.stringify(settings));
                saveSettingsDebounced();

                renderRuleList($namefixContainer, settings.nameFixRules);
                renderRuleList($simpleContainer, settings.simpleReplacements, true);
                renderRuleList($regexContainer, settings.regexRules);
                renderRuleList($contextContainer, settings.contextRules);

                alert("📥 导入成功！");
            } catch (err) {
                console.error("[梦晏晨] 导入失败:", err);
                alert("⚠️ 文件格式错误");
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    });

    // 日志折叠按钮
    let logVisible = true;
    const $logToggle = $('<button id="meng-log-toggle" style="position:absolute;top:12px;right:18px;padding:4px 8px;font-size:0.9rem;border-radius:6px;border:none;background:#10b981;color:white;cursor:pointer;">📜 收起日志</button>');
    $overlay.find("> div").append($logToggle);
    $logToggle.on("click", () => {
        logVisible = !logVisible;
        $liveLog.toggle(logVisible);
        $logToggle.text(logVisible ? "📜 收起日志" : "📜 显示日志");
    });
}

// ================== Panda 按钮注入 ==================
function injectPandaButton(context) {
    const target = $("#data_bank_wand_container");
    if (!target.length) {
        setTimeout(() => injectPandaButton(context), 500);
        return;
    }
    if ($("#meng-panda-btn").length) return;

    const btn = $(`
        <div id="meng-panda-btn" style="
            cursor:pointer; padding:6px 10px; border-radius:12px;
            background:rgba(0,128,0,0.15); display:flex; align-items:center;
            gap:6px; font-size:1rem; margin-top:4px; user-select:none;
            transition:background 0.25s;
        ">
            <span>🐼</span><span>梦晏晨</span>
        </div>
    `);

    btn.hover(
        () => btn.css("background", "rgba(0,128,0,0.25)"),
        () => btn.css("background", "rgba(0,128,0,0.15)")
    );

    btn.on("click", () => {
        openMengPanel(context);
    });

    target.append(btn);
    console.log("[梦晏晨] 🐼 Panda 按钮注入成功");
}

// 挂载全局 API
window.MengUI = window.MengUI || {};
window.MengUI.openMengPanel = openMengPanel;
window.MengUI.injectPandaButton = injectPandaButton;

// 自动注入（页面就绪时）
$(document).ready(() => {
    const context = window.SillyTavern?.getContext?.() || {};
    window.MengUI.injectPandaButton(context);
});

// ================== RuleManager 模块（内联） ==================
(function() {
    let rules = [];
    const STORAGE_KEY = "meng_rule_manager_rules";
    const updateCallbacks = [];

    async function loadRules() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                rules = JSON.parse(stored);
            } else {
                rules = [];
            }
            console.log(`[梦晏晨 RuleManager] 📂 已加载 ${rules.length} 条规则`);
            restoreRegexCache();
        } catch (err) {
            console.error("[梦晏晨 RuleManager] 加载规则失败", err);
            rules = [];
        }
    }

    async function saveRules() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
            console.log(`[梦晏晨 RuleManager] 💾 规则已保存，共 ${rules.length} 条`);
            notifyUpdate();
            return true;
        } catch (err) {
            console.error("[梦晏晨 RuleManager] 保存失败", err);
            return false;
        }
    }

    async function addRule(rule) {
        if (!rule || typeof rule !== "object") {
            console.warn("[梦晏晨 RuleManager] addRule收到非法规则");
            return false;
        }
        if (typeof rule.enabled !== "boolean") rule.enabled = true;
        if (!rule.id) {
            rule.id = "meng_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
        }
        rules.push(rule);
        console.log("[梦晏晨 RuleManager] ➕ 已添加规则:", rule);
        await saveRules();
        return true;
    }

    async function removeRule(ruleId) {
        const oldLength = rules.length;
        rules = rules.filter(r => r.id !== ruleId);
        if (rules.length === oldLength) {
            console.warn(`[梦晏晨 RuleManager] ⚠️ 未找到规则ID: ${ruleId}`);
            return false;
        }
        console.log(`[梦晏晨 RuleManager] 🗑️ 已删除规则 ${ruleId}`);
        await saveRules();
        return true;
    }

    async function updateRule(ruleId, newData) {
        const target = rules.find(r => r.id === ruleId);
        if (!target) {
            console.warn(`[梦晏晨 RuleManager] ⚠️ updateRule 未找到 ${ruleId}`);
            return false;
        }
        Object.assign(target, newData);
        if (target.type === "regex") {
            try {
                target._regex = new RegExp(target.pattern, target.flags || "g");
            } catch (err) {
                console.warn("[梦晏晨 RuleManager] regex重新编译失败", target.pattern);
            }
        }
        console.log("[梦晏晨 RuleManager] ✏️ 规则已更新", target);
        await saveRules();
        return true;
    }

    async function toggleRule(ruleId, enabled) {
        const target = rules.find(r => r.id === ruleId);
        if (!target) {
            console.warn(`[梦晏晨 RuleManager] toggleRule未找到 ${ruleId}`);
            return false;
        }
        target.enabled = !!enabled;
        console.log(`[梦晏晨 RuleManager] 🔘 ${enabled ? "启用" : "禁用"}规则`, target);
        await saveRules();
        return true;
    }

    async function clearRules(type = null) {
        if (!type) {
            rules = [];
            console.log("[梦晏晨 RuleManager] ⚠️ 已清空全部规则");
        } else {
            rules = rules.filter(r => r.type !== type);
            console.log(`[梦晏晨 RuleManager] ⚠️ 已清空 ${type} 类型规则`);
        }
        await saveRules();
    }

    function exportRules() {
        try {
            const blob = new Blob([JSON.stringify(rules, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `梦晏晨规则备份_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            console.log("[梦晏晨 RuleManager] 📤 规则导出成功");
        } catch (err) {
            console.error("[梦晏晨 RuleManager] 导出失败", err);
        }
    }

    async function importRules(json) {
        try {
            const imported = typeof json === "string" ? JSON.parse(json) : json;
            if (!Array.isArray(imported)) {
                console.warn("[梦晏晨 RuleManager] 导入格式错误");
                return false;
            }
            imported.forEach(rule => {
                if (rule.type === "regex") {
                    try {
                        rule._regex = new RegExp(rule.pattern, rule.flags || "g");
                    } catch (err) {
                        console.warn("[梦晏晨 RuleManager] regex导入失败", rule.pattern);
                    }
                }
                if (typeof rule.enabled !== "boolean") rule.enabled = true;
                if (!rule.id) rule.id = "meng_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
            });
            rules = imported;
            await saveRules();
            console.log(`[梦晏晨 RuleManager] 📥 导入成功，共 ${rules.length} 条`);
            return true;
        } catch (err) {
            console.error("[梦晏晨 RuleManager] 导入失败", err);
            return false;
        }
    }

    function registerUpdateCallback(callback) {
        if (typeof callback !== "function") {
            console.warn("[梦晏晨 RuleManager] registerUpdateCallback参数非法");
            return;
        }
        updateCallbacks.push(callback);
        console.log("[梦晏晨 RuleManager] ✅ 已注册更新监听");
    }

    function notifyUpdate() {
        console.log("[梦晏晨 RuleManager] 📢 开始广播规则更新");
        updateCallbacks.forEach(fn => {
            try { fn(rules); } catch (err) { console.error("[梦晏晨 RuleManager] updateCallback执行失败", err); }
        });
    }

    function restoreRegexCache() {
        rules.forEach(rule => {
            if (rule.type !== "regex" || rule._regex) return;
            try {
                rule._regex = new RegExp(rule.pattern, rule.flags || "g");
                console.log(`[梦晏晨 RuleManager] ♻️ regex恢复成功: ${rule.pattern}`);
            } catch (err) {
                console.warn(`[梦晏晨 RuleManager] regex恢复失败: ${rule.pattern}`);
            }
        });
    }

    function syncUI() {
        if (!window.MengUI || typeof window.MengUI.renderRuleList !== "function") return;
        const nameFix = rules.filter(r => r.type === "nameFix");
        const simple = rules.filter(r => r.type === "simple");
        const regex = rules.filter(r => r.type === "regex");
        const context = rules.filter(r => r.type === "context");
        window.MengUI.renderRuleList("#meng-namefix-container", nameFix);
        window.MengUI.renderRuleList("#meng-simple-container", simple, true);
        window.MengUI.renderRuleList("#meng-regex-container", regex);
        window.MengUI.renderRuleList("#meng-context-container", context);
    }

    async function initialize() {
        console.log("[梦晏晨 RuleManager] 🚀 开始初始化...");
        await loadRules();
        notifyUpdate();
        console.log(`[梦晏晨 RuleManager] ✅ 初始化完成，共 ${rules.length} 条规则`);
    }

    // 定时自动保存
    setInterval(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
            console.log("[梦晏晨 RuleManager] ⏱️ 定时自动保存完成");
        } catch (err) {
            console.error("[梦晏晨 RuleManager] 定时保存失败", err);
        }
    }, 1000 * 60 * 3);

    // 页面关闭保存
    window.addEventListener("beforeunload", () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
            console.log("[梦晏晨 RuleManager] 💾 页面关闭前自动保存成功");
        } catch (err) {
            console.error("[梦晏晨 RuleManager] 页面关闭自动保存失败", err);
        }
    });

    // 暴露 API
    window.MengRuleManager = {
        addRule,
        removeRule,
        updateRule,
        toggleRule,
        clearRules,
        exportRules,
        importRules,
        registerUpdateCallback,
        syncUI,
        initialize,
        getRules: () => rules,
    };

    // 自动启动
    initialize();
})();

// ================== 全局错误日志 ==================
window.addEventListener("error", (event) => {
    console.error("[梦晏晨] ❌ 全局错误", event.error);
    const $liveLog = $("#meng-live-log");
    if ($liveLog.length) {
        $liveLog.append(`🕒 [${new Date().toLocaleTimeString()}] ❌ 检测到错误: ${event.message || "未知错误"}\n`);
        $liveLog.scrollTop($liveLog[0].scrollHeight);
    }
});

window.addEventListener("unhandledrejection", (event) => {
    console.error("[梦晏晨] ❌ Promise未捕获错误", event.reason);
    const $liveLog = $("#meng-live-log");
    if ($liveLog.length) {
        $liveLog.append(`🕒 [${new Date().toLocaleTimeString()}] ❌ Promise错误: ${String(event.reason)}\n`);
        $liveLog.scrollTop($liveLog[0].scrollHeight);
    }
});

console.log("[梦晏晨] ui.js (含 RuleManager) 加载完成");