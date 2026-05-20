// ======================
// 1梦晏晨 Cleaner Cache
// ======================

// ===== 文本缓存 =====
const MENG_CACHE = new Map();

// ===== 最大缓存数量 =====
const MAX_CACHE_SIZE = 500;

// ======================
// 获取缓存
// ======================

function getCache(text) {

    try {

        if (!text) return null;

        if (MENG_CACHE.has(text)) {

            console.log(
                "[梦晏晨 Cleaner] ⚡ 命中缓存"
            );

            return MENG_CACHE.get(text);
        }

    } catch(err) {

        console.warn(
            "[梦晏晨 Cleaner] 获取缓存失败",
            err
        );
    }

    return null;
}

// ======================
// 写入缓存
// ======================

function setCache(
    original,
    cleaned
) {

    try {

        if (
            !original ||
            typeof original !== "string"
        ) {

            return;
        }

        // ===== 防止缓存爆炸 =====
        if (
            MENG_CACHE.size >=
            MAX_CACHE_SIZE
        ) {

            const firstKey =
                MENG_CACHE
                    .keys()
                    .next()
                    .value;

            MENG_CACHE.delete(
                firstKey
            );

            console.log(
                "[梦晏晨 Cleaner] 🧹 自动清理旧缓存"
            );
        }

        MENG_CACHE.set(
            original,
            cleaned
        );

    } catch(err) {

        console.warn(
            "[梦晏晨 Cleaner] 写入缓存失败",
            err
        );
    }
}

// ======================
// 清空缓存
// ======================

function clearCache() {

    try {

        MENG_CACHE.clear();

        console.log(
            "[梦晏晨 Cleaner] ♻️ 缓存已清空"
        );

    } catch(err) {

        console.warn(
            "[梦晏晨 Cleaner] 清空缓存失败",
            err
        );
    }
}

// ======================
// 获取缓存状态
// ======================

function getCacheInfo() {

    return {

        size:
            MENG_CACHE.size,

        max:
            MAX_CACHE_SIZE
    };
}

// ======================
// 梦晏晨 Cleaner Ultimate
// cleaner.js
// Part 1 / 5
// ======================

console.log("[梦晏晨 Cleaner] 模块开始加载...");

// ===== 全局命名空间 =====
window.MengYanChen = window.MengYanChen || {};
window.MengLogs = window.MengLogs || [];
window.MengRuntime = window.MengRuntime || {};

// ===== Cleaner 状态 =====
window.MengRuntime.cleanerLoaded = false;
window.MengRuntime.cleanerWorking = false;
window.MengRuntime.lastCleanTime = 0;

// ===== 日志函数 =====
function mengLog(message, type = "log") {

    const time = new Date().toLocaleTimeString();

    const finalMsg = `🕒 [${time}] ${message}`;

    window.MengLogs.push(finalMsg);

    if (window.MengLogs.length > 500) {
        window.MengLogs.shift();
    }

    const liveLog = document.querySelector("#meng-live-log");

    if (liveLog) {

        liveLog.textContent += finalMsg + "\n";

        liveLog.scrollTop = liveLog.scrollHeight;
    }

    console[type]("[梦晏晨 Cleaner]", message);
}

// ===== Toast =====
function mengToast(msg) {

    try {

        if (window.toastr) {

            toastr.success(msg);

        } else {

            console.log("[Toast]", msg);
        }

    } catch(err) {

        console.warn("[梦晏晨] toast失败", err);
    }

    mengLog(msg);
}

// ===== 安全HTML =====
function escapeRegExp(str = "") {

    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ===== 超长文本保护 =====
function safeSliceText(text, limit = 500000) {

    if (!text) return "";

    if (text.length <= limit) return text;

    mengLog(`⚠️ 文本过长，已截断 (${text.length})`);

    return text.slice(0, limit);
}

// ===== 白名单 =====
const WHITELIST = new Set([

    "{{user}}",
    "{{char}}",
    "<USER>",
    "<BOT>",
    "[SYSTEM]",
    "[INST]",
    "</s>",
    "<s>",
    "```",
    "json",
    "markdown",
]);

// ===== 白名单保护 =====
function protectWhitelist(text) {

    const map = {};

    let index = 0;

    for (const item of WHITELIST) {

        const token = `__MENG_WHITE_${index}__`;

        map[token] = item;

        text = text.split(item).join(token);

        index++;
    }

    return { text, map };
}

// ===== 白名单恢复 =====
function restoreWhitelist(text, map = {}) {

    for (const key in map) {

        text = text.split(key).join(map[key]);
    }

    return text;
}

// ===== 变量保护 =====
function protectVariables(text) {

    const variableMap = {};

    let index = 0;

    text = text.replace(/\{\{[^}]+\}\}/g, (match) => {

        const token = `__MENG_VAR_${index}__`;

        variableMap[token] = match;

        index++;

        return token;
    });

    return { text, variableMap };
}

// ===== 变量恢复 =====
function restoreVariables(text, variableMap = {}) {

    for (const key in variableMap) {

        text = text.split(key).join(variableMap[key]);
    }

    return text;
}

// ===== 正则安全编译 =====
function buildSafeRegex(pattern, flags = "g") {

    try {

        return new RegExp(pattern, flags);

    } catch(err) {

        mengLog(`⚠️ 无效正则: ${pattern}`);

        return null;
    }
}

// ===== 防重复清洗 =====
const cleanedCache = new WeakSet();

// ===== 主 Cleaner =====
window.MengCleaner = {

    version: "Ultimate v3",

    async cleanText(text, settings = {}) {

        try {

            if (!text) return text;

            // ===== 防止重复进入 =====
            if (window.MengRuntime.cleanerWorking) {

                mengLog("⚠️ Cleaner 正在运行，跳过重复调用");

                return text;
            }

            window.MengRuntime.cleanerWorking = true;

            // ===== 文本保护 =====
            text = safeSliceText(String(text));

            // ===== 白名单保护 =====
            const whiteData = protectWhitelist(text);

            text = whiteData.text;

            // ===== 变量保护 =====
            const varData = protectVariables(text);

            text = varData.text;

            mengLog("🧠 开始执行文本清洗");

            // ===== 下一部分继续 =====


            // ======================
            // cleaner.js
            // Part 2 / 5
            // ======================

            // ===== 设置安全初始化 =====
            settings.nameFixRules =
                Array.isArray(settings.nameFixRules)
                    ? settings.nameFixRules
                    : [];

            settings.simpleReplacements =
                Array.isArray(settings.simpleReplacements)
                    ? settings.simpleReplacements
                    : [];

            settings.regexRules =
                Array.isArray(settings.regexRules)
                    ? settings.regexRules
                    : [];

            settings.contextRules =
                Array.isArray(settings.contextRules)
                    ? settings.contextRules
                    : [];

            // ===== 统计 =====
            let replaceCount = 0;

            // ======================
            // 名字修正
            // ======================

            for (const rule of settings.nameFixRules) {

                try {

                    if (!rule) continue;

                    if (!rule.enabled) continue;

                    if (!rule.from || !rule.to) continue;

                    const escaped = escapeRegExp(rule.from);

                    const regex = new RegExp(escaped, "g");

                    const before = text;

                    text = text.replace(regex, rule.to);

                    if (before !== text) {

                        replaceCount++;

                        mengLog(
                            `📛 名字修正: ${rule.from} → ${rule.to}`
                        );
                    }

                } catch(err) {

                    mengLog(
                        `⚠️ 名字修正规则错误: ${rule.from}`
                    );
                }
            }

            // ======================
            // 简单替换
            // ======================

            for (const rule of settings.simpleReplacements) {

                try {

                    if (!rule) continue;

                    if (!rule.enabled) continue;

                    if (!rule.from) continue;

                    const escaped = escapeRegExp(rule.from);

                    const regex = new RegExp(escaped, "g");

                    const before = text;

                    text = text.replace(
                        regex,
                        rule.to || ""
                    );

                    if (before !== text) {

                        replaceCount++;

                        mengLog(
                            `🧹 简单替换: ${rule.from}`
                        );
                    }

                } catch(err) {

                    mengLog(
                        `⚠️ 简单替换错误: ${rule.from}`
                    );
                }
            }

            // ======================
            // Context 删除
            // ======================

            for (const rule of settings.contextRules) {

                try {

                    if (!rule) continue;

                    if (!rule.enabled) continue;

                    if (!rule.pattern) continue;

                    const escaped =
                        escapeRegExp(rule.pattern);

                    const regex = new RegExp(escaped, "g");

                    const before = text;

                    text = text.replace(regex, "");

                    if (before !== text) {

                        replaceCount++;

                        mengLog(
                            `✂️ Context 删除: ${rule.pattern}`
                        );
                    }

                } catch(err) {

                    mengLog(
                        `⚠️ Context 删除失败`
                    );
                }
            }

            // ======================
            // 正则规则
            // ======================

            for (const rule of settings.regexRules) {

                try {

                    if (!rule) continue;

                    if (!rule.enabled) continue;

                    if (!rule.pattern) continue;

                    // ===== 编译缓存 =====
                    if (!rule._regex) {

                        rule._regex = buildSafeRegex(
                            rule.pattern,
                            rule.flags || "g"
                        );
                    }

                    if (!rule._regex) continue;

                    const before = text;

                    text = text.replace(
                        rule._regex,
                        rule.replace || ""
                    );

                    if (before !== text) {

                        replaceCount++;

                        mengLog(
                            `⚙️ Regex 生效: ${rule.pattern}`
                        );
                    }

                } catch(err) {

                    mengLog(
                        `⚠️ Regex 执行失败: ${rule.pattern}`
                    );
                }
            }

            // ===== 下一部分继续 =====
            // ======================
            // cleaner.js
            // Part 3 / 5
            // ======================

            // ======================
            // AI 名字学习系统
            // ======================

            window.MengYanChen.correctNames =
                window.MengYanChen.correctNames || new Set();

            window.MengYanChen.pendingConfirmations =
                window.MengYanChen.pendingConfirmations || [];

            // ===== 中文名字检测 =====
            const chineseNameRegex =
                /[\u4e00-\u9fa5]{2,4}/g;

            const foundNames =
                text.match(chineseNameRegex) || [];

            // ===== 常见无意义词 =====
            const commonWords = new Set([

                "自己",
                "我们",
                "他们",
                "你们",
                "少女",
                "少年",
                "女人",
                "男人",
                "东西",
                "时候",
                "感觉",
                "地方",
                "眼睛",
                "眸子",
                "身体",
                "声音",
                "空气",
                "表情",
                "呼吸",
                "系统",
                "宿主",
                "主人",
                "哥哥",
                "姐姐",
                "宝宝",
                "妈咪",
                "爹地",
                "先生",
                "小姐",
                "医生",
                "老师",

            ]);

            // ===== 名字学习 =====
            for (const word of foundNames) {

                try {

                    if (!word) continue;

                    // ===== 白名单过滤 =====
                    if (commonWords.has(word)) {
                        continue;
                    }

                    // ===== 已确认 =====
                    if (
                        window.MengYanChen.correctNames.has(word)
                    ) {
                        continue;
                    }

                    // ===== 已存在待确认 =====
                    const alreadyPending =
                        window.MengYanChen.pendingConfirmations
                            .some(i => i.correct === word);

                    if (alreadyPending) {
                        continue;
                    }

                    // ===== 推送待确认 =====
                    window.MengYanChen.pendingConfirmations
                        .push({

                            wrong: "待确认",
                            correct: word,
                        });

                    mengLog(
                        `🧠 发现疑似新名字: ${word}`
                    );

                } catch(err) {

                    mengLog(
                        `⚠️ 名字学习失败`
                    );
                }
            }

            // ======================
            // AI 防误伤系统
            // ======================

            // 防止连续替换符号崩坏
            text = text.replace(
                /([。！？,\.\?!]){3,}/g,
                "$1"
            );

            // 防止空格爆炸
            text = text.replace(/[ \t]{4,}/g, " ");

            // 防止连续空行
            text = text.replace(/\n{4,}/g, "\n\n");

            // 防止 markdown 崩坏
            text = text.replace(/```{2,}/g, "```");

            // 防止 JSON 爆炸
            text = text.replace(
                /"\s*:\s*,/g,
                '":"",'
            );

            // 防止 undefined/null 泄漏
            text = text.replace(/\bundefined\b/g, "");
            text = text.replace(/\bnull\b/g, "");

            // ======================
            // 特殊文本保护
            // ======================

            // URL保护
            text = text.replace(
                /(https?:\/\/[^\s]+)/g,
                (m) => {

                    return `__MENG_URL__${
                        btoa(m)
                    }__`;
                }
            );

            // Email保护
            text = text.replace(
                /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+)/g,
                (m) => {

                    return `__MENG_EMAIL__${
                        btoa(m)
                    }__`;
                }
            );

            mengLog(
                `✨ 当前累计规则命中: ${replaceCount}`
            );

            // ===== 下一部分继续 =====
            // ======================
            // cleaner.js
            // Part 4 / 5
            // ======================

            // ======================
            // URL 恢复
            // ======================

            text = text.replace(
                /__MENG_URL__(.*?)__/g,
                (_, encoded) => {

                    try {

                        return atob(encoded);

                    } catch(err) {

                        mengLog(
                            "⚠️ URL恢复失败"
                        );

                        return "";
                    }
                }
            );

            // ======================
            // Email 恢复
            // ======================

            text = text.replace(
                /__MENG_EMAIL__(.*?)__/g,
                (_, encoded) => {

                    try {

                        return atob(encoded);

                    } catch(err) {

                        mengLog(
                            "⚠️ Email恢复失败"
                        );

                        return "";
                    }
                }
            );

            // ======================
            // 变量恢复
            // ======================

            text = restoreVariables(
                text,
                varData.variableMap
            );

            // ======================
            // 白名单恢复
            // ======================

            text = restoreWhitelist(
                text,
                whiteData.map
            );

            // ======================
            // 二次安全修复
            // ======================

            // Unicode修复
            text = text.normalize("NFC");

            // BOM移除
            text = text.replace(/^\uFEFF/, "");

            // 奇怪控制字符
            text = text.replace(
                /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
                ""
            );

            // 超长空白修复
            text = text.replace(/\s{20,}/g, " ");

            // ======================
            // 结果安全检查
            // ======================

            if (typeof text !== "string") {

                mengLog(
                    "⚠️ cleanText 输出异常，已回退"
                );

                text = String(text || "");
            }

            // 防止完全清空
            if (!text.trim()) {

                mengLog(
                    "⚠️ 清洗后文本为空，已阻止覆盖"
                );

                window.MengRuntime.cleanerWorking = false;

                return "";
            }

            // ======================
            // 清洗成功
            // ======================

            window.MengRuntime.lastCleanTime =
                Date.now();

            mengLog(
                `✅ 文本清洗完成 (${replaceCount} 项命中)`
            );

            // ===== 下一部分继续 =====
            // ======================
            // cleaner.js
            // Part 5 / 5
            // ======================

            // ===== 解锁 Cleaner =====
            window.MengRuntime.cleanerWorking = false;

            // ===== 返回结果 =====
            return text;

        } catch(err) {

            console.error(
                "[梦晏晨 Cleaner] 崩溃:",
                err
            );

            mengLog(
                `💥 Cleaner崩溃: ${err.message || err}`
            );

            // ===== 强制解锁 =====
            window.MengRuntime.cleanerWorking = false;

            // ===== 防止整个 ST 崩掉 =====
            try {

                return String(text || "");

            } catch {

                return "";
            }
        }
    }
};

// ======================
// 启动日志
// ======================

window.MengRuntime.cleanerLoaded = true;

mengLog("✅ Cleaner 模块加载完成");

mengLog("🧠 AI名字学习系统已启动");

mengLog("🛡️ 白名单保护系统已启动");

mengLog("⚙️ Regex 安全编译系统已启动");

mengLog("📦 变量保护系统已启动");

mengLog("🔒 Cleaner 崩溃保护已启动");

mengLog("✨ Ultimate Cleaner Ready");

// ======================
// 暴露 API
// ======================

window.MengCleanerAPI = {

    clean: window.MengCleaner.cleanText,

    log: mengLog,

    toast: mengToast,
};

// ======================
// 导出
// ======================

export {
    mengLog,
    mengToast,
};

export default window.MengCleaner;