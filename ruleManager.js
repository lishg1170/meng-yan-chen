// RuleManager.js
// TauriTavern 专用规则管理器
const RuleManager = (() => {
    let _rules = [];
    let _updateCallbacks = [];

    // ===== 加载规则 =====
    async function loadRules() {
        try {
            const context = window.SillyTavern?.getContext?.();
            if (!context) throw new Error("未获取到 context");
            const savedRules = context.extension_settings?.["meng-yan-chen"]?.rules || [];
            _rules = Array.isArray(savedRules) ? savedRules : [];
            console.log("[梦晏晨 RuleManager] 规则已加载", _rules.length, "条");
        } catch (err) {
            console.warn("[梦晏晨 RuleManager] 加载规则失败:", err);
            _rules = [];
        }
        return _rules;
    }

    // ===== 保存规则 =====
    async function saveRules(newRules) {
        try {
            const context = window.SillyTavern?.getContext?.();
            if (!context) throw new Error("未获取到 context");
            context.extension_settings["meng-yan-chen"] = context.extension_settings["meng-yan-chen"] || {};
            context.extension_settings["meng-yan-chen"].rules = newRules;
            if (typeof context.saveSettingsDebounced === "function") context.saveSettingsDebounced();
            _rules = newRules;
            console.log("[梦晏晨 RuleManager] 规则已保存", _rules.length, "条");

            // 回调通知
            _updateCallbacks.forEach(cb => {
                try { cb(_rules); } catch (e) { console.warn("[梦晏晨 RuleManager 回调失败]", e); }
            });
        } catch (err) {
            console.error("[梦晏晨 RuleManager] 保存规则失败:", err);
        }
    }

    // ===== 注册规则更新回调 =====
    function registerUpdateCallback(cb) {
        if (typeof cb === "function") _updateCallbacks.push(cb);
    }

    return {
        loadRules,
        saveRules,
        registerUpdateCallback,
    };
})();

export default RuleManager;