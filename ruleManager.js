// ruleManager.js
// ============================
// 梦晏晨规则管理器（自动刷新 MengCleaner 内部缓存）
// ============================

// 默认 GitHub 初始化规则文件（空文件也行）
const DEFAULT_RULES_URL = "https://raw.githubusercontent.com/lishg1170/meng-yan-chen/refs/heads/main/menganchen.json";

// 本地存储 key
const STORAGE_KEY = "梦晏晨_rules";

// 内部缓存，避免每次都 fetch
let _cachedRules = null;

// 注册 MengCleaner 缓存刷新函数（可选）
let _onRulesUpdated = null;

export default {
    /**
     * 注册规则更新回调（例如刷新 MengCleaner 内部缓存）
     * @param {function} callback 回调函数，参数是最新规则数组
     */
    registerUpdateCallback(callback) {
        _onRulesUpdated = callback;
    },

    /**
     * 加载规则
     * @returns {Promise<Array>} 规则数组
     */
    async loadRules() {
        if (_cachedRules) return _cachedRules;

        try {
            let raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const rules = JSON.parse(raw);
                if (Array.isArray(rules)) {
                    _cachedRules = rules;
                    return rules;
                }
            }

            // 本地没有则尝试 GitHub 初始化
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

            // 保存到本地
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
            _cachedRules = rules;
            console.log("[梦晏晨 RuleManager] 已从 GitHub 初始化规则:", rules);
            return rules;
        } catch (e) {
            console.warn("[梦晏晨 RuleManager] 加载规则失败:", e);
            _cachedRules = [];
            return [];
        }
    },

    /**
     * 保存规则
     * @param {Array} rules 规则数组
     */
    saveRules(rules) {
        if (!Array.isArray(rules)) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rules || []));
            _cachedRules = rules;
            console.log("[梦晏晨 RuleManager] 已保存规则:", rules);

            // 调用更新回调刷新 MengCleaner 内部缓存
            if (_onRulesUpdated) _onRulesUpdated(rules);
        } catch (e) {
            console.error("[梦晏晨 RuleManager] 保存规则失败:", e);
        }
    },

    /**
     * 添加新规则
     * @param {Object} rule
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
     * @param {number} index
     */
    async removeRule(index) {
        const rules = await this.loadRules();
        if (index < 0 || index >= rules.length) return;
        const removed = rules.splice(index, 1);
        this.saveRules(rules);
        console.log("[梦晏晨 RuleManager] 删除规则:", removed[0]);
    },

    /**
     * 覆盖全部规则
     * @param {Array} newRules
     */
    replaceRules(newRules) {
        this.saveRules(newRules);
        console.log("[梦晏晨 RuleManager] 已覆盖全部规则");
    }
};