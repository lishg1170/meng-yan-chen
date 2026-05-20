// ==============================
// ruleManager.js
// ==============================

const STORAGE_KEY = "MengRules"; // 存储在 localStorage 的 key

const RuleManager = {
    /**
     * 加载规则
     * @returns {Array} 规则数组
     */
    loadRules() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return []; // 没有存储返回空数组
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed;
        } catch (e) {
            console.error("[Meng][RuleManager] 读取规则失败:", e);
            return [];
        }
    },

    /**
     * 保存规则
     * @param {Array} rules 规则数组
     */
    saveRules(rules) {
        try {
            if (!Array.isArray(rules)) throw new Error("rules必须是数组");
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
            console.log("[Meng][RuleManager] 规则已保存:", rules);
        } catch (e) {
            console.error("[Meng][RuleManager] 保存规则失败:", e);
        }
    },

    /**
     * 添加新规则
     * @param {Object} rule 单条规则对象
     */
    addRule(rule) {
        const rules = this.loadRules();
        rules.push(rule);
        this.saveRules(rules);
    },

    /**
     * 删除规则
     * @param {Function} filterFn 筛选函数，返回true的保留，false的删除
     */
    removeRule(filterFn) {
        const rules = this.loadRules();
        const newRules = rules.filter(filterFn);
        this.saveRules(newRules);
    },

    /**
     * 清空所有规则
     */
    clearRules() {
        this.saveRules([]);
    }
};

// ==============================
// 挂全局
// ==============================
window.MengRules = RuleManager.loadRules();
window.MengRulesSave = (newRules) => {
    window.MengRules = newRules;
    RuleManager.saveRules(newRules);
};

export default RuleManager;