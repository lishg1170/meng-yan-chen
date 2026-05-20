(function() {
    console.log("[梦晏晨 RuleManager] 脚本加载开始");

    // ===== 默认规则 =====
    const DEFAULT_RULES = [
        { type: "nameFix", from: "林晟", to: "林晨", enabled: true },
        { type: "nameFix", from: "林辰", to: "林晨", enabled: true },
        { type: "simple", from: "眸子", to: "眼睛", enabled: true },
        { type: "regex", pattern: "\\s{2,}", replace: " ", flags: "g", enabled: true },
        { type: "context", pattern: "敏感词", enabled: true }
    ];

    // ===== RuleManager 类 =====
    function RuleManager() {
        console.log("[梦晏晨 RuleManager] 初始化实例");
        this._rules = [];
        this._updateCallbacks = [];
        this._initialized = false;
    }

    // ===== 异步加载规则 =====
    RuleManager.prototype.loadRules = async function() {
        console.log("[梦晏晨 RuleManager] loadRules 开始");
        try {
            const context = window.SillyTavern?.getContext?.();
            const PLUGIN_ID = "meng-yan-chen";
            const savedRules = context?.extension_settings?.[PLUGIN_ID]?.rules;

            if (savedRules && Array.isArray(savedRules)) {
                this._rules = savedRules;
                console.log("[梦晏晨 RuleManager] 从 extension_settings 加载规则 ✅", savedRules);
            } else {
                this._rules = [...DEFAULT_RULES];
                console.log("[梦晏晨 RuleManager] 使用默认规则 ✅", DEFAULT_RULES);
            }

            this._initialized = true;
            return this._rules;
        } catch (err) {
            console.error("[梦晏晨 RuleManager] loadRules 错误 ❌", err);
            this._rules = [...DEFAULT_RULES];
            return this._rules;
        }
    };

    // ===== 异步保存规则 =====
    RuleManager.prototype.saveRules = async function(rules) {
        console.log("[梦晏晨 RuleManager] saveRules 开始", rules);
        try {
            if (!Array.isArray(rules)) throw new Error("保存的规则必须是数组");
            this._rules = rules;

            const context = window.SillyTavern?.getContext?.();
            const PLUGIN_ID = "meng-yan-chen";

            if (!context.extension_settings) context.extension_settings = {};
            if (!context.extension_settings[PLUGIN_ID]) context.extension_settings[PLUGIN_ID] = {};

            context.extension_settings[PLUGIN_ID].rules = this._rules;

            // 异步调用防抖保存，保证异常不会阻断
            if (typeof context.saveSettingsDebounced === "function") {
                try { context.saveSettingsDebounced(); } catch (err) { console.warn("[RuleManager] saveSettingsDebounced 错误", err); }
            }

            // 调用回调
            this._updateCallbacks.forEach(cb => {
                try { cb(this._rules); } catch (err) { console.error("[梦晏晨 RuleManager callback 错误]:", err); }
            });

            console.log("[梦晏晨 RuleManager] saveRules 成功 ✅");
            return true;
        } catch (err) {
            console.error("[梦晏晨 RuleManager] saveRules 错误 ❌", err);
            return false;
        }
    };

    // ===== 注册更新回调 =====
    RuleManager.prototype.registerUpdateCallback = function(cb) {
        if (typeof cb === "function") {
            if (!this._updateCallbacks.includes(cb)) { // 防止重复注册
                this._updateCallbacks.push(cb);
            }
            console.log("[梦晏晨 RuleManager] 注册更新回调 ✅");
        } else {
            console.warn("[梦晏晨 RuleManager] registerUpdateCallback 参数不是函数 ❌");
        }
    };

    // ===== 获取所有规则 =====
    RuleManager.prototype.getRules = function() {
        return this._rules;
    };

    // ===== 单例挂载 =====
    const ruleManagerInstance = new RuleManager();
    window.RuleManager = RuleManager;
    window.MengRuleManager = ruleManagerInstance;

    console.log("[梦晏晨 RuleManager] 脚本加载完成 ✅ 单例已挂载到 window.MengRuleManager");
})();