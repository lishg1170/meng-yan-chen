// ruleManager.js
// ============================
// 梦晏晨规则管理器（Tauri/iPad 原生适配版）
// ============================

// 默认 GitHub 初始化规则文件（空文件也行）
const DEFAULT_RULES_URL = "https://raw.githubusercontent.com/lishg1170/meng-yan-chen/refs/heads/main/menganchen.json";

// 本地存储 key
const STORAGE_KEY = "梦晏晨_rules";

export default {
    /**
     * 加载规则
     * 1️⃣ 先尝试本地存储
     * 2️⃣ 如果本地没有，再去 GitHub 拉取初始化文件
     * @returns {Promise<Array>} 规则数组
     */
    async loadRules() {
        try {
            // 1️⃣ 本地存储优先
            let raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const rules = JSON.parse(raw);
                if (Array.isArray(rules)) return rules;
            }

            // 2️⃣ 本地没有则尝试 GitHub 初始化拉取
            console.log("[梦晏晨 RuleManager] 本地存储为空，尝试 GitHub 初始化");
            const response = await fetch(DEFAULT_RULES_URL);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            raw = await response.text();

            let rules = [];
            try {
                rules = JSON.parse(raw);
                if (!Array.isArray(rules)) rules = [];
            } catch (e) {
                console.warn("[梦晏晨 RuleManager] GitHub 文件解析失败，使用空数组");
                rules = [];
            }

            // 3️⃣ 保存到本地存储，保证下次直接使用
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
            console.log("[梦晏晨 RuleManager] 已从 GitHub 初始化规则:", rules);
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
    async addRule(rule) {
        if (!rule || typeof rule !== "object") return;
        const rules = await this.loadRules();
        rules.push(rule);
        this.saveRules(rules);
        console.log("[梦晏晨 RuleManager] 添加规则:", rule);
    },

    /**
     * 删除指定索引规则
     * @param {number} index 索引
     */
    async removeRule(index) {
        const rules = await this.loadRules();
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