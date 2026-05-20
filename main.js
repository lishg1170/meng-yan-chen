// main.js (插件入口)
(async () => {
    console.log("[Meng] 插件初始化中…");

    // 异步加载模块
    let cleanerPromise = import("./cleaner.js")
        .then(m => { window.MengCleaner = m.MengCleaner || m.default; })
        .catch(e => console.warn("[Meng] cleaner加载失败", e));

    let uiPromise = import("./ui.js")
        .then(m => { window.MengUI = m; console.log("[Meng] UI加载完成"); })
        .catch(e => console.warn("[Meng] UI加载失败", e));

    // 永久规则挂全局
    const RuleManagerModule = await import("./ruleManager.js");
    const RuleManager = RuleManagerModule.default;

    window.MengRules = RuleManager.loadRules();
    window.MengRulesSave = (newRules) => {
        window.MengRules = newRules;
        RuleManager.saveRules(newRules);
    };
    window.MengRulesAdd = (rule) => {
        RuleManager.addRule(rule);
        window.MengRules = RuleManager.loadRules();
    };
    window.MengRulesRemove = (index) => {
        RuleManager.removeRule(index);
        window.MengRules = RuleManager.loadRules();
    };

    console.log("[Meng] 永久规则已加载", window.MengRules);

    // 等待其他模块加载完成
    await Promise.all([cleanerPromise, uiPromise]);

    console.log("[Meng] 插件初始化完成 ✅");
})();