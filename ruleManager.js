// ruleManager.js
const RULES_KEY = "mengYanChenRules";

const RuleManager = {
    loadRules() {
        try {
            const raw = localStorage.getItem(RULES_KEY);
            if (!raw) return {};
            return JSON.parse(raw);
        } catch (e) {
            console.warn("[Meng] 读取规则失败", e);
            return {};
        }
    },
    saveRules(newRules) {
        try {
            localStorage.setItem(RULES_KEY, JSON.stringify(newRules));
            console.log("[Meng] 规则已保存", newRules);
        } catch (e) {
            console.error("[Meng] 保存规则失败", e);
        }
    }
};

export default RuleManager;