// ==============================
// 规则管理完整模板
// ==============================

(async () => {
    console.log("[梦晏晨] 插件初始化规则管理");

    // ===== 插件 ID 和上下文 =====
    const PLUGIN_ID = "meng-yan-chen";
    const context = window.SillyTavern?.getContext?.();
    const extension_settings = context?.extension_settings || {};
    const saveSettingsDebounced = context?.saveSettingsDebounced || (() => {});

    // ===== 默认规则（防止报错） =====
    window.MengRules = [];
    window.MengRulesSave = (newRules) => {
        window.MengRules = newRules;
        console.log("[Meng] 已保存规则到全局", window.MengRules);

        // 尝试同步写入 RuleManager
        if (window.RuleManager) {
            try {
                window.RuleManager.saveRules(newRules);
                console.log("[Meng] 已保存规则到 RuleManager");
            } catch (e) {
                console.warn("[Meng] RuleManager 保存规则失败", e);
            }
        }

        // 尝试写入 localStorage
        try {
            localStorage.setItem("MengRules", JSON.stringify(newRules));
            console.log("[Meng] 已保存规则到 localStorage");
        } catch (e) {
            console.warn("[Meng] localStorage 保存规则失败", e);
        }
    };

    // ===== 异步导入 RuleManager（如果有） =====
    try {
        const RuleManagerModule = await import("./ruleManager.js");
        const RuleManager = RuleManagerModule.default;
        window.RuleManager = RuleManager;

        // 读取规则
        try {
            const loadedRules = RuleManager.loadRules();
            window.MengRules = loadedRules || window.MengRules;
            console.log("[Meng] 从 RuleManager 加载规则", window.MengRules);
        } catch (e) {
            console.warn("[Meng] RuleManager 读取规则失败", e);
        }
    } catch (e) {
        console.warn("[Meng] RuleManager 模块加载失败", e);

        // 如果没有 RuleManager，则尝试 localStorage
        try {
            const stored = localStorage.getItem("MengRules");
            if (stored) {
                window.MengRules = JSON.parse(stored);
                console.log("[Meng] 从 localStorage 加载规则", window.MengRules);
            } else {
                console.log("[Meng] localStorage 没有规则，使用默认空数组");
            }
        } catch (e2) {
            console.warn("[Meng] localStorage 读取规则失败", e2);
        }
    }

    // ===== 调试辅助函数 =====
    window.printMengRules = () => {
        console.log("[Meng] 当前规则", window.MengRules);
    };
    window.addMengRule = (rule) => {
        window.MengRules.push(rule);
        window.MengRulesSave(window.MengRules);
    };
    window.clearMengRules = () => {
        window.MengRules = [];
        window.MengRulesSave(window.MengRules);
    };

    console.log("[梦晏晨] 规则管理初始化完成");
})();