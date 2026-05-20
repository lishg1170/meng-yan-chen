// 负责永久保存插件规则（求别崩溃）
const RuleManager = {
    STORAGE_KEY: "meng_rules", // 本地存储 key

    // 加载规则
    loadRules() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return [];
            const rules = JSON.parse(raw);
            if (!Array.isArray(rules)) return [];
            return rules;
        } catch (err) {
            console.warn("[RuleManager] 规则加载失败", err);
            return [];
        }
    },

    // 保存规则
    saveRules(rules) {
        try {
            if (!Array.isArray(rules)) throw new Error("规则必须是数组");
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rules));
            console.log("[RuleManager] 规则已保存", rules);
        } catch (err) {
            console.warn("[RuleManager] 规则保存失败", err);
        }
    },

    // 新增一条规则
    addRule(rule) {
        const rules = this.loadRules();
        rules.push(rule);
        this.saveRules(rules);
    },

    // 删除一条规则（根据 index）
    removeRule(index) {
        const rules = this.loadRules();
        if (index < 0 || index >= rules.length) return;
        rules.splice(index, 1);
        this.saveRules(rules);
    }
};

export default RuleManager;
