// ======================
// 梦晏晨 RuleManager
// Ultimate Edition
// 修复版
// ======================

console.log("[梦晏晨 RuleManager] 模块启动");

// ======================
// 全局对象
// ======================

window.MengRuleManager = window.MengRuleManager || {};
const RuleManager = window.MengRuleManager;

// ======================
// 插件ID
// ======================

const PLUGIN_ID = "meng-yan-chen";

// ======================
// 默认规则
// ======================

const DEFAULT_RULES = {
    nameFixRules: [
        { from: "林晟", to: "林晨", enabled: true, desc: "默认名字修正" },
        { from: "林辰", to: "林晨", enabled: true, desc: "默认名字修正" }
    ],
    simpleReplacements: [
        { from: "眸子", to: "眼睛", enabled: true }
    ],
    regexRules: [],
    contextRules: [],
    statusWhiteList: [
        { keyword: "状态栏", enabled: true }
    ]
};

// ======================
// 内存缓存
// ======================

RuleManager.rules = RuleManager.rules || structuredClone(DEFAULT_RULES);
RuleManager.listeners = RuleManager.listeners || [];
RuleManager.logListeners = RuleManager.logListeners || [];
RuleManager.backupPool = RuleManager.backupPool || [];
RuleManager.regexCache = RuleManager.regexCache || new Map();

// ======================
// 日志系统
// ======================

RuleManager.appendLog = function(msg) {
    try {
        const text = `🕒 [${new Date().toLocaleTimeString()}] ${msg}`;
        console.log("[梦晏晨 RuleManager]", msg);

        // UI日志
        const logEl = document.querySelector("#meng-live-log");
        if (logEl) {
            logEl.textContent += text + "\n";
            logEl.scrollTop = logEl.scrollHeight;
        }

        // 广播日志
        RuleManager.logListeners.forEach(fn => {
            try {
                fn(text);
            } catch (err) {
                console.warn("[梦晏晨 RuleManager] 日志监听失败", err);
            }
        });
    } catch (err) {
        console.warn("[梦晏晨 RuleManager] appendLog失败", err);
    }
};

// ======================
// 注册日志监听
// ======================

RuleManager.onLog = function(fn) {
    if (typeof fn !== "function") return;
    RuleManager.logListeners.push(fn);
};

// ======================
// 获取上下文
// ======================

RuleManager.getContext = function() {
    try {
        return window.SillyTavern?.getContext?.();
    } catch (err) {
        console.warn("[梦晏晨 RuleManager] 获取Context失败", err);
    }
    return null;
};

// ======================
// 获取设置存储
// ======================

RuleManager.getStorage = function() {
    try {
        const context = RuleManager.getContext();
        if (!context) {
            RuleManager.appendLog("⚠️ Context不存在");
            return null;
        }
        context.extension_settings = context.extension_settings || {};
        context.extension_settings[PLUGIN_ID] = context.extension_settings[PLUGIN_ID] || {};
        return context.extension_settings;
    } catch (err) {
        console.error("[梦晏晨 RuleManager] getStorage失败", err);
    }
    return null;
};

// ======================
// 深拷贝
// ======================

RuleManager.deepClone = function(obj) {
    try {
        return structuredClone(obj);
    } catch (err) {
        return JSON.parse(JSON.stringify(obj));
    }
};

// ======================
// 保存设置
// ======================

RuleManager.saveRules = async function() {
    try {
        const storage = RuleManager.getStorage();
        if (!storage) {
            RuleManager.appendLog("⚠️ 保存失败：storage不存在");
            return false;
        }

        storage[PLUGIN_ID] = RuleManager.deepClone(RuleManager.rules);
        const context = RuleManager.getContext();
        if (context?.saveSettingsDebounced) {
            context.saveSettingsDebounced();
        }

        localStorage.setItem("meng_rule_backup", JSON.stringify(RuleManager.rules));
        RuleManager.appendLog("💾 规则已持久化保存");
        return true;
    } catch (err) {
        console.error("[梦晏晨 RuleManager] saveRules失败", err);
        RuleManager.appendLog(`❌ 保存失败: ${err.message}`);
    }
    return false;
};

// ======================
// 加载规则
// ======================

RuleManager.loadRules = async function() {
    try {
        RuleManager.appendLog("📂 开始加载规则");
        const storage = RuleManager.getStorage();
        const saved = storage?.[PLUGIN_ID];

        if (saved && typeof saved === "object") {
            RuleManager.rules = {
                ...structuredClone(DEFAULT_RULES),
                ...RuleManager.deepClone(saved)
            };
            RuleManager.appendLog("✅ 已从 extension_settings 加载规则");
        } else {
            const localBackup = localStorage.getItem("meng_rule_backup");
            if (localBackup) {
                try {
                    RuleManager.rules = JSON.parse(localBackup);
                    RuleManager.appendLog("♻️ 已从本地备份恢复规则");
                } catch (err) {
                    RuleManager.appendLog("⚠️ 本地备份恢复失败");
                }
            } else {
                RuleManager.rules = structuredClone(DEFAULT_RULES);
                RuleManager.appendLog("🆕 使用默认规则");
            }
        }
        return RuleManager.rules;
    } catch (err) {
        console.error("[梦晏晨 RuleManager] loadRules失败", err);
        RuleManager.appendLog(`❌ 加载失败: ${err.message}`);
    }
    return structuredClone(DEFAULT_RULES);
};

// ======================
// 广播更新
// ======================

RuleManager.broadcastUpdate = function() {
    try {
        RuleManager.appendLog("📡 广播规则更新");
        RuleManager.listeners.forEach(fn => {
            try {
                fn(RuleManager.deepClone(RuleManager.rules));
            } catch (err) {
                console.warn("[梦晏晨 RuleManager] 广播失败", err);
            }
        });
    } catch (err) {
        console.error("[梦晏晨 RuleManager] broadcastUpdate失败", err);
    }
};

// ======================
// 注册更新监听
// ======================

RuleManager.registerUpdateCallback = function(fn) {
    if (typeof fn !== "function") return;
    RuleManager.listeners.push(fn);
    RuleManager.appendLog("🔗 已注册更新监听器");
};

// ======================
// 正则危险检测
// ======================

RuleManager.isDangerousRegex = function(pattern = "") {
    try {
        const dangerList = [
            /(.\+)+/,
            /(\.\*)+/,
            /(\w\+)+/,
            /(\[\^.*\]\*)+/
        ];
        return dangerList.some(reg => reg.test(pattern));
    } catch (err) {
        return false;
    }
};

// ======================
// 正则编译池
// ======================

RuleManager.compileRegexRule = function(rule) {
    try {
        if (!rule?.pattern) return null;
        if (RuleManager.regexCache.has(rule.pattern)) {
            return RuleManager.regexCache.get(rule.pattern);
        }
        if (RuleManager.isDangerousRegex(rule.pattern)) {
            RuleManager.appendLog(`⚠️ 已拦截危险正则: ${rule.pattern}`);
            return null;
        }
        const compiled = new RegExp(rule.pattern, rule.flags || "g");
        RuleManager.regexCache.set(rule.pattern, compiled);
        RuleManager.appendLog(`⚡ 正则已编译: ${rule.pattern}`);
        return compiled;
    } catch (err) {
        RuleManager.appendLog(`❌ 正则编译失败: ${rule.pattern}`);
    }
    return null;
};

// ======================
// 编译所有正则
// ======================

RuleManager.compileAllRegex = function() {
    try {
        const list = RuleManager.rules?.regexRules || [];
        let success = 0;
        list.forEach(rule => {
            const compiled = RuleManager.compileRegexRule(rule);
            if (compiled) {
                rule._regex = compiled;
                success++;
            }
        });
        RuleManager.appendLog(`⚡ 正则编译完成: ${success}/${list.length}`);
    } catch (err) {
        console.error("[梦晏晨 RuleManager] compileAllRegex失败", err);
    }
};

// ======================
// 规则冲突检测
// ======================

RuleManager.detectConflicts = function() {
    try {
        const conflicts = [];
        const nameMap = new Map();
        (RuleManager.rules?.nameFixRules || []).forEach(rule => {
            if (!rule?.from) return;
            if (nameMap.has(rule.from)) {
                conflicts.push(`名字规则重复: ${rule.from}`);
            }
            nameMap.set(rule.from, true);
        });

        const simpleMap = new Map();
        (RuleManager.rules?.simpleReplacements || []).forEach(rule => {
            if (!rule?.from) return;
            if (simpleMap.has(rule.from)) {
                conflicts.push(`脏词规则重复: ${rule.from}`);
            }
            simpleMap.set(rule.from, true);
        });

        const regexMap = new Map();
        (RuleManager.rules?.regexRules || []).forEach(rule => {
            if (!rule?.pattern) return;
            if (regexMap.has(rule.pattern)) {
                conflicts.push(`正则重复: ${rule.pattern}`);
            }
            regexMap.set(rule.pattern, true);
        });

        if (conflicts.length > 0) {
            conflicts.forEach(msg => RuleManager.appendLog(`⚠️ ${msg}`));
        } else {
            RuleManager.appendLog("✅ 未发现规则冲突");
        }
        return conflicts;
    } catch (err) {
        console.error("[梦晏晨 RuleManager] detectConflicts失败", err);
    }
    return [];
};

// ======================
// 获取规则
// ======================

RuleManager.getRules = function() {
    return RuleManager.deepClone(RuleManager.rules);
};

// ======================
// 获取白名单
// ======================

RuleManager.getStatusWhiteList = function() {
    return (RuleManager.rules?.statusWhiteList || []);
};

// ======================
// 更新规则（合并）
// ======================

RuleManager.updateRules = async function(newRules = {}) {
    try {
        RuleManager.appendLog("🔄 开始更新规则");
        RuleManager.rules = {
            ...RuleManager.rules,
            ...RuleManager.deepClone(newRules)
        };
        RuleManager.compileAllRegex();
        RuleManager.detectConflicts();
        await RuleManager.saveRules();
        RuleManager.broadcastUpdate();
        RuleManager.appendLog("✅ 规则更新完成");
        return true;
    } catch (err) {
        console.error("[梦晏晨 RuleManager] updateRules失败", err);
        RuleManager.appendLog(`❌ 更新失败: ${err.message}`);
    }
    return false;
};

// ======================
// 同步外部设置（兼容 index.js 调用）
// ======================

RuleManager.syncSettings = async function(settings) {
    try {
        if (!settings) return false;
        RuleManager.appendLog("🔄 开始同步外部设置");
        // 将 settings 中的规则数组同步到内部 rules 对象
        const rules = RuleManager.rules;
        rules.nameFixRules = Array.isArray(settings.nameFixRules) ? RuleManager.deepClone(settings.nameFixRules) : [];
        rules.simpleReplacements = Array.isArray(settings.simpleReplacements) ? RuleManager.deepClone(settings.simpleReplacements) : [];
        rules.regexRules = Array.isArray(settings.regexRules) ? RuleManager.deepClone(settings.regexRules) : [];
        rules.contextRules = Array.isArray(settings.contextRules) ? RuleManager.deepClone(settings.contextRules) : [];
        // 保留 statusWhiteList 不动（如已存在）
        rules.statusWhiteList = rules.statusWhiteList || [];
        RuleManager.compileAllRegex();
        RuleManager.detectConflicts();
        await RuleManager.saveRules();
        RuleManager.broadcastUpdate();
        RuleManager.appendLog("✅ 外部设置同步完成");
        return true;
    } catch (err) {
        console.error("[梦晏晨 RuleManager] syncSettings失败", err);
        RuleManager.appendLog(`❌ 同步失败: ${err.message}`);
    }
    return false;
};

// ======================
// 自动备份
// ======================

RuleManager.createBackup = function() {
    try {
        const backup = {
            time: Date.now(),
            rules: RuleManager.deepClone(RuleManager.rules)
        };
        RuleManager.backupPool.push(backup);
        if (RuleManager.backupPool.length > 15) {
            RuleManager.backupPool.shift();
        }
        localStorage.setItem("meng_rule_backup_pool", JSON.stringify(RuleManager.backupPool));
        RuleManager.appendLog("📦 已创建规则备份");
    } catch (err) {
        console.error("[梦晏晨 RuleManager] createBackup失败", err);
    }
};

// ======================
// 恢复备份池
// ======================

RuleManager.restoreBackupPool = function() {
    try {
        const raw = localStorage.getItem("meng_rule_backup_pool");
        if (!raw) return;
        RuleManager.backupPool = JSON.parse(raw);
        RuleManager.appendLog(`♻️ 已恢复备份池 (${RuleManager.backupPool.length})`);
    } catch (err) {
        console.warn("[梦晏晨 RuleManager] restoreBackupPool失败", err);
    }
};

// ======================
// 回滚规则
// ======================

RuleManager.rollback = async function(index = null) {
    try {
        const pool = RuleManager.backupPool;
        if (!pool.length) {
            RuleManager.appendLog("⚠️ 没有可回滚备份");
            return false;
        }
        const target = index === null ? pool[pool.length - 1] : pool[index];
        if (!target?.rules) {
            RuleManager.appendLog("⚠️ 回滚目标不存在");
            return false;
        }
        RuleManager.rules = RuleManager.deepClone(target.rules);
        await RuleManager.saveRules();
        RuleManager.broadcastUpdate();
        RuleManager.appendLog("♻️ 已成功回滚规则");
        return true;
    } catch (err) {
        console.error("[梦晏晨 RuleManager] rollback失败", err);
        RuleManager.appendLog(`❌ 回滚失败: ${err.message}`);
    }
    return false;
};

// ======================
// 清理非法规则
// ======================

RuleManager.cleanInvalidRules = function() {
    try {
        const rules = RuleManager.rules;
        rules.nameFixRules = (rules.nameFixRules || []).filter(rule => rule && typeof rule.from === "string" && typeof rule.to === "string");
        rules.simpleReplacements = (rules.simpleReplacements || []).filter(rule => rule && typeof rule.from === "string");
        rules.regexRules = (rules.regexRules || []).filter(rule => rule && typeof rule.pattern === "string");
        rules.contextRules = (rules.contextRules || []).filter(rule => rule && typeof rule.pattern === "string");
        RuleManager.appendLog("🧹 非法规则清理完成");
    } catch (err) {
        console.error("[梦晏晨 RuleManager] cleanInvalidRules失败", err);
    }
};

// ======================
// 导出规则
// ======================

RuleManager.exportRules = function() {
    try {
        const json = JSON.stringify(RuleManager.rules, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `梦晏晨规则备份-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        RuleManager.appendLog("📤 规则导出完成");
    } catch (err) {
        console.error("[梦晏晨 RuleManager] exportRules失败", err);
    }
};

// ======================
// 导入规则
// ======================

RuleManager.importRules = async function(jsonText) {
    try {
        if (typeof jsonText !== "string") {
            throw new Error("导入数据必须是字符串");
        }
        const parsed = JSON.parse(jsonText);
        if (!parsed || typeof parsed !== "object") {
            throw new Error("配置格式错误");
        }
        RuleManager.createBackup();
        RuleManager.rules = {
            ...structuredClone(DEFAULT_RULES),
            ...RuleManager.deepClone(parsed)
        };
        RuleManager.cleanInvalidRules();
        RuleManager.compileAllRegex();
        await RuleManager.saveRules();
        RuleManager.broadcastUpdate();
        RuleManager.appendLog("📥 导入规则完成");
        return true;
    } catch (err) {
        console.error("[梦晏晨 RuleManager] importRules失败", err);
        RuleManager.appendLog(`❌ 导入失败: ${err.message}`);
    }
    return false;
};

// ======================
// 崩溃恢复
// ======================

RuleManager.crashRecover = async function() {
    try {
        RuleManager.appendLog("🛠️ 尝试崩溃恢复");
        const backup = localStorage.getItem("meng_rule_backup");
        if (!backup) {
            RuleManager.appendLog("⚠️ 没有发现崩溃备份");
            return false;
        }
        RuleManager.rules = JSON.parse(backup);
        RuleManager.cleanInvalidRules();
        RuleManager.compileAllRegex();
        await RuleManager.saveRules();
        RuleManager.broadcastUpdate();
        RuleManager.appendLog("♻️ 崩溃恢复成功");
        return true;
    } catch (err) {
        console.error("[梦晏晨 RuleManager] crashRecover失败", err);
    }
    return false;
};

// ======================
// 初始化
// ======================

RuleManager.init = async function() {
    try {
        RuleManager.appendLog("🚀 RuleManager 初始化开始");
        RuleManager.restoreBackupPool();
        await RuleManager.loadRules();
        RuleManager.cleanInvalidRules();
        RuleManager.compileAllRegex();
        RuleManager.detectConflicts();
        await RuleManager.saveRules();
        RuleManager.broadcastUpdate();
        RuleManager.appendLog("✅ RuleManager 初始化完成");
        window.MengReady = window.MengReady || {};
        window.MengReady.ruleManager = Promise.resolve(true);
    } catch (err) {
        console.error("[梦晏晨 RuleManager] init失败", err);
        RuleManager.appendLog(`❌ 初始化失败: ${err.message}`);
    }
};

// ======================
// 自动启动
// ======================

(async () => {
    try {
        await RuleManager.init();
    } catch (err) {
        console.error("[梦晏晨 RuleManager] 自动启动失败", err);
    }
})();

console.log("[梦晏晨 RuleManager] 模块加载完毕");