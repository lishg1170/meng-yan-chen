// ruleManager.js

const RULE_STORAGE_KEY = "meng_rules_v1";

const RuleManager = {
    _rulesCache: [],
    _updateCallbacks: [],

    // ==== 1️⃣ 加载规则 ====
    async loadRules() {
        try {
            const raw = localStorage.getItem(RULE_STORAGE_KEY);
            if (!raw) {
                console.log("[梦晏晨 RuleManager] 未找到规则，返回空数组");
                this._rulesCache = [];
                return this._rulesCache;
            }
            const parsed = JSON.parse(raw);
            this._rulesCache = Array.isArray(parsed) ? parsed : [];
            console.log(`[梦晏晨 RuleManager] 加载规则成功，数量: ${this._rulesCache.length}`);
            return this._rulesCache;
        } catch (err) {
            console.error("[梦晏晨 RuleManager] loadRules 错误 ❌", err);
            this._rulesCache = [];
            return this._rulesCache;
        }
    },

    // ==== 2️⃣ 保存规则 ====
    async saveRules(newRules) {
        try {
            if (!Array.isArray(newRules)) {
                console.warn("[梦晏晨 RuleManager] saveRules: newRules 不是数组，忽略保存");
                return;
            }
            this._rulesCache = newRules;
            localStorage.setItem(RULE_STORAGE_KEY, JSON.stringify(newRules));
            console.log(`[梦晏晨 RuleManager] 保存规则成功，数量: ${newRules.length}`);

            // ==== 调用回调 ====
            this._updateCallbacks.forEach(cb => {
                try { cb(this._rulesCache); }
                catch(err) { console.error("[梦晏晨 RuleManager] updateCallback 错误 ❌", err); }
            });
        } catch (err) {
            console.error("[梦晏晨 RuleManager] saveRules 错误 ❌", err);
        }
    },

    // ==== 3️⃣ 注册规则更新回调 ====
    registerUpdateCallback(callback) {
        if (typeof callback !== "function") {
            console.warn("[梦晏晨 RuleManager] registerUpdateCallback: 参数不是函数");
            return;
        }
        this._updateCallbacks.push(callback);
        console.log("[梦晏晨 RuleManager] 注册更新回调，当前回调数量:", this._updateCallbacks.length);
    },

    // ==== 4️⃣ 获取当前规则缓存 ====
    getRules() {
        return this._rulesCache.slice(); // 返回副本，防止外部修改
    },

    // ==== 5️⃣ 添加新规则 ====
    async addRule(rule) {
        if (!rule || !rule.type) {
            console.warn("[梦晏晨 RuleManager] addRule: rule 格式不对", rule);
            return;
        }
        this._rulesCache.push(rule);
        console.log("[梦晏晨 RuleManager] 添加新规则:", rule);
        await this.saveRules(this._rulesCache);
    },

    // ==== 6️⃣ 删除规则（按 index） ====
    async removeRule(index) {
        if (typeof index !== "number" || index < 0 || index >= this._rulesCache.length) {
            console.warn("[梦晏晨 RuleManager] removeRule: index 无效", index);
            return;
        }
        const removed = this._rulesCache.splice(index, 1);
        console.log("[梦晏晨 RuleManager] 删除规则:", removed[0]);
        await this.saveRules(this._rulesCache);
    },

    // ==== 7️⃣ 更新规则（按 index） ====
    async updateRule(index, newRule) {
        if (typeof index !== "number" || index < 0 || index >= this._rulesCache.length) {
            console.warn("[梦晏晨 RuleManager] updateRule: index 无效", index);
            return;
        }
        this._rulesCache[index] = newRule;
        console.log("[梦晏晨 RuleManager] 更新规则:", newRule);
        await this.saveRules(this._rulesCache);
    }
};

export default RuleManager;