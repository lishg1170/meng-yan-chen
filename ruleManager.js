// ruleManager.js
const STORAGE_KEY = "梦晏晨_rules";

export default {
    /**
     * 加载规则
     * @returns {Array} 规则数组
     */
    loadRules() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const rules = JSON.parse(raw);
            if (!Array.isArray(rules)) return [];
            return rules;
        } catch (e) {
            console.warn("[梦晏晨 RuleManager] 加载规则失败:", e);
            return [];
        }
    },

    /**
     * 保存规则
     * @param {Array} rules 规则数组
     */
    saveRules(rules) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rules || []));
            console.log("[梦晏晨 RuleManager] 已保存规则:", rules);
        } catch (e) {
            console.error("[梦晏晨 RuleManager] 保存规则失败:", e);
        }
    },

    /**
     * 添加新规则
     * @param {Object} rule { from, to, enabled }
     */
    addRule(rule) {
        if (!rule || typeof rule !== "object") return;
        const rules = this.loadRules();
        rules.push(rule);
        this.saveRules(rules);
        console.log("[梦晏晨 RuleManager] 添加规则:", rule);
    },

    /**
     * 删除指定索引规则
     * @param {number} index 索引
     */
    removeRule(index) {
        const rules = this.loadRules();
        if (index < 0 || index >= rules.length) return;
        const removed = rules.splice(index, 1);
        this.saveRules(rules);
        console.log("[梦晏晨 RuleManager] 删除规则:", removed[0]);
    },

    /**
     * 覆盖所有规则
     * @param {Array} newRules 新规则数组
     */
    replaceRules(newRules) {
        if (!Array.isArray(newRules)) return;
        this.saveRules(newRules);
        console.log("[梦晏晨 RuleManager] 已覆盖全部规则");
    }
};