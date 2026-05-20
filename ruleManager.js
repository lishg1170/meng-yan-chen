// ruleManager.js
// ============================
// 梦晏晨规则管理器（Tauri/iPad 专用）
// ============================

const DEFAULT_RULES_URL = "https://raw.githubusercontent.com/lishg1170/meng-yan-chen/refs/heads/main/menganchen.json";
const STORAGE_KEY = "梦晏晨_rules";

export default {
    /**
     * 加载规则
     * Tauri/iPad 异步安全
     */
    async loadRules() {
        try {
            // 1️⃣ 本地优先
            let raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const rules = JSON.parse(raw);
                if (Array.isArray(rules)) return rules;
            }

            // 2️⃣ 本地没有则从 GitHub 拉取
            console.log("[梦晏晨 RuleManager] 本地存储为空，尝试 GitHub 初始化");
            const resp = await fetch(DEFAULT_RULES_URL);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            raw = await resp.text();

            let rules = [];
            try {
                rules = JSON.parse(raw);
                if (!Array.isArray(rules)) rules = [];
            } catch {
                rules = [];
            }

            // 3️⃣ 写入 localStorage 保证下次可用
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
            console.log("[梦晏晨 RuleManager] 已初始化规则:", rules);
            return rules;

        } catch (e) {
            console.warn("[梦晏晨 RuleManager] 加载失败:", e);
            return [];
        }
    },

    saveRules(rules) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rules || []));
            console.log("[梦晏晨 RuleManager] 已保存规则:", rules);
        } catch (e) {
            console.error("[梦晏晨 RuleManager] 保存失败:", e);
        }
    },

    async addRule(rule) {
        if (!rule || typeof rule !== "object") return;
        const rules = await this.loadRules();
        rules.push(rule);
        this.saveRules(rules);
    },

    async removeRule(index) {
        const rules = await this.loadRules();
        if (index < 0 || index >= rules.length) return;
        rules.splice(index, 1);
        this.saveRules(rules);
    },

    replaceRules(newRules) {
        if (!Array.isArray(newRules)) return;
        this.saveRules(newRules);
    }
};