// ruleManager.js
// 用于管理插件规则，支持永久保存到 SillyTavern 的 extension_settings

const RuleManager = {
    STORAGE_KEY: "meng_rules",

    // 读取规则，如果没有则返回空数组
    loadRules() {
        try {
            const context = window.SillyTavern?.getContext?.();
            const settings = context?.extension_settings || {};
            const rulesJson = settings[this.STORAGE_KEY];
            if (!rulesJson) return [];
            return JSON.parse(rulesJson);
        } catch (e) {
            console.warn("[Meng] 读取规则失败", e);
            return [];
        }
    },

    // 保存规则
    saveRules(newRules) {
        try {
            const context = window.SillyTavern?.getContext?.();
            if (!context?.extension_settings) return;
            context.extension_settings[this.STORAGE_KEY] = JSON.stringify(newRules);

            // 调用 ST 自带保存方法
            if (typeof context.saveSettingsDebounced === "function") {
                context.saveSettingsDebounced();
            }

            console.log("[Meng] 规则已保存", newRules);
        } catch (e) {
            console.warn("[Meng] 保存规则失败", e);
        }
    },

    // 增加单条规则
    addRule(rule) {
        const rules = this.loadRules();
        rules.push(rule);
        this.saveRules(rules);
    },

    // 删除单条规则（按 index）
    removeRule(index) {
        const rules = this.loadRules();
        if (index < 0 || index >= rules.length) return;
        rules.splice(index, 1);
        this.saveRules(rules);
    }
};

// ✅ 导出默认对象
export default RuleManager;