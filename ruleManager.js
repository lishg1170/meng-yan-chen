// RuleManager.js

// 默认规则示例
const DEFAULT_RULES = [
    { type: "nameFix", from: "林晟", to: "林晨", enabled: true },
    { type: "nameFix", from: "林辰", to: "林晨", enabled: true },
    { type: "simple", from: "眸子", to: "眼睛", enabled: true },
    // regex示例
    { type: "regex", pattern: "\\s{2,}", replace: " ", flags: "g", enabled: true },
    // context规则示例
    { type: "context", pattern: "敏感词", enabled: true }
];

class RuleManager {
    constructor() {
        this._rules = [];
        this._updateCallbacks = [];
        this._initialized = false;
    }

    // ===== 加载规则 =====
    async loadRules() {
        try {
            // 尝试从 TauriTavern extension_settings 读取
            const context = window.SillyTavern?.getContext?.();
            const PLUGIN_ID = "meng-yan-chen";
            const savedRules = context?.extension_settings?.[PLUGIN_ID]?.rules;
            if (savedRules && Array.isArray(savedRules)) {
                this._rules = savedRules;
            } else {
                this._rules = [...DEFAULT_RULES];
            }
            this._initialized = true;
            return this._rules;
        } catch (err) {
            console.warn("[梦晏晨] RuleManager loadRules 错误:", err);
            this._rules = [...DEFAULT_RULES];
            return this._rules;
        }
    }

    // ===== 保存规则 =====
    async saveRules(rules) {
        try {
            if (!Array.isArray(rules)) throw new Error("保存的规则必须是数组");
            this._rules = rules;

            const context = window.SillyTavern?.getContext?.();
            const PLUGIN_ID = "meng-yan-chen";
            if (!context.extension_settings[PLUGIN_ID]) context.extension_settings[PLUGIN_ID] = {};
            context.extension_settings[PLUGIN_ID].rules = this._rules;

            if (typeof context.saveSettingsDebounced === "function") {
                context.saveSettingsDebounced();
            }

            // 调用回调
            this._updateCallbacks.forEach(cb => {
                try { cb(this._rules); } catch (err) { console.error("[梦晏晨] RuleManager callback 错误:", err); }
            });

            return true;
        } catch (err) {
            console.error("[梦晏晨] RuleManager saveRules 错误:", err);
            return false;
        }
    }

    // ===== 注册更新回调 =====
    registerUpdateCallback(cb) {
        if (typeof cb === "function") {
            this._updateCallbacks.push(cb);
        } else {
            console.warn("[梦晏晨] RuleManager registerUpdateCallback 参数不是函数");
        }
    }

    // ===== 获取所有规则 =====
    getRules() {
        return this._rules;
    }
}

// 单例
const ruleManagerInstance = new RuleManager();

export default ruleManagerInstance;
export { RuleManager };