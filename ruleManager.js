// 文件: ruleManager.js
// 作用：永久保存规则到 localStorage

const RuleManager = {
    STORAGE_KEY: "meng_rules",

    loadRules() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) return [];
        try { return JSON.parse(raw); } catch { return []; }
    },

    saveRules(rules) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rules));
    },

    addRule(rule) {
        const rules = this.loadRules();
        rules.push(rule);
        this.saveRules(rules);
    },

    removeRule(index) {
        const rules = this.loadRules();
        rules.splice(index, 1);
        this.saveRules(rules);
    }
};

// ✅ 导出模块
export default RuleManager;