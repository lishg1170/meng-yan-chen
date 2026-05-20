// ruleManager.js
(function(){
    const RuleManager = {
        loadRules() {
            try {
                const saved = localStorage.getItem("mengRules");
                return saved ? JSON.parse(saved) : [];
            } catch(e) {
                console.warn("[梦晏晨] 规则加载失败", e);
                return [];
            }
        },
        saveRules(newRules) {
            try {
                localStorage.setItem("mengRules", JSON.stringify(newRules));
                console.log("[梦晏晨] 规则已保存", newRules);
            } catch(e) {
                console.warn("[梦晏晨] 规则保存失败", e);
            }
        }
    };

    // 挂全局
    window.MengRuleManager = RuleManager;
})();