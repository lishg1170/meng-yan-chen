// ======================
// 梦晏晨 Cleaner Ultimate
// ======================

const MENG_CACHE = new Map();
const MAX_CACHE_SIZE = 500;

function getCache(text) {
    if (!text) return null;
    if (MENG_CACHE.has(text)) return MENG_CACHE.get(text);
    return null;
}

function setCache(original, cleaned) {
    if (!original || typeof original !== "string") return;
    if (MENG_CACHE.size >= MAX_CACHE_SIZE) {
        const firstKey = MENG_CACHE.keys().next().value;
        MENG_CACHE.delete(firstKey);
    }
    MENG_CACHE.set(original, cleaned);
}

function clearCache() { MENG_CACHE.clear(); }

console.log("[梦晏晨 Cleaner] 模块开始加载...");

window.MengYanChen = window.MengYanChen || {};
window.MengLogs = window.MengLogs || [];
window.MengRuntime = window.MengRuntime || {};

window.MengRuntime.cleanerWorking = false;

window.mengLog = window.mengLog || function(message, type = "log") {
    const time = new Date().toLocaleTimeString();
    const finalMsg = `🕒 [${time}] ${message}`;
    window.MengLogs.push(finalMsg);
    if (window.MengLogs.length > 500) window.MengLogs.shift();
    console[type]("[梦晏晨 Cleaner]", message);
    try {
        const logBox = document.querySelector("#meng-live-log");
        if (logBox) { logBox.textContent += finalMsg + "\n"; logBox.scrollTop = logBox.scrollHeight; }
    } catch (err) {}
};

function escapeRegExp(str = "") {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const WHITELIST = new Set([
    "{{user}}", "{{char}}", "<USER>", "<BOT>", "[SYSTEM]", "[INST]",
    "</s>", "<s>", "```", "json", "markdown",
]);

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

function restoreWhitelist(text, map = {}) {
    for (const key in map) text = text.split(key).join(map[key]);
    return text;
}

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

function restoreVariables(text, variableMap = {}) {
    for (const key in variableMap) text = text.split(key).join(variableMap[key]);
    return text;
}

function safeBtoa(str) {
    try {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        const binaryString = String.fromCharCode(...bytes);
        return btoa(binaryString);
    } catch(e) {
        return btoa(unescape(encodeURIComponent(str)));
    }
}

function safeAtob(encoded) {
    try {
        const binaryString = atob(encoded);
        const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
        const decoder = new TextDecoder();
        return decoder.decode(bytes);
    } catch(e) {
        return decodeURIComponent(escape(atob(encoded)));
    }
}

window.MengCleaner = {
    version: "Ultimate v3",

    async cleanText(text, settings = {}) {
        try {
            if (!text) return text;
            const cached = getCache(text);
            if (cached !== null) return cached;

            if (window.MengRuntime.cleanerWorking) {
                window.mengLog("⚠️ Cleaner 正在运行，跳过重复调用");
                return text;
            }
            window.MengRuntime.cleanerWorking = true;

            text = String(text).slice(0, settings.maxTextLength || 500000);

            // 白名单保护（条件）
            let whiteData = { text, map: {} };
            if (settings.protectWhitelist) {
                whiteData = protectWhitelist(text);
                text = whiteData.text;
            }

            // 变量保护（条件）
            let varData = { text, variableMap: {} };
            if (settings.protectVariables) {
                varData = protectVariables(text);
                text = varData.text;
            }

            // 状态栏/标签保护（条件）
            let statusBarMap = {};
            if (settings.protectStatusBar) {
                let idx = 0;
                text = text.replace(
                    /<([a-zA-Z\u4e00-\u9fa5][^>\s]*)[^>]*>[\s\S]*?<\/\1>|\[[^\]]*\]/g,
                    (m) => {
                        const token = `MENGBLOCK${idx}`;
                        statusBarMap[token] = m;
                        idx++;
                        return token;
                    }
                );
            }

            window.mengLog("🧠 开始执行文本清洗");

            // 初始化规则数组
            settings.nameFixRules = Array.isArray(settings.nameFixRules) ? settings.nameFixRules : [];
            settings.simpleReplacements = Array.isArray(settings.simpleReplacements) ? settings.simpleReplacements : [];
            settings.regexRules = Array.isArray(settings.regexRules) ? settings.regexRules : [];
            settings.contextRules = Array.isArray(settings.contextRules) ? settings.contextRules : [];

            let replaceCount = 0;

            // 名字修正
            for (const rule of settings.nameFixRules) {
                try {
                    if (!rule || !rule.enabled || !rule.from || !rule.to) continue;
                    const escaped = escapeRegExp(rule.from);
                    if (!escaped) continue;
                    const regex = new RegExp(escaped, "g");
                    const before = text;
                    text = text.replace(regex, rule.to);
                    if (before !== text) {
                        replaceCount++;
                        window.mengLog(`📛 名字修正: ${rule.from} → ${rule.to}`);
                    }
                } catch(err) {
                    window.mengLog(`⚠️ 名字修正规则错误: ${rule.from}`);
                }
            }

            // 简单替换
            for (const rule of settings.simpleReplacements) {
                try {
                    if (!rule || !rule.enabled || !rule.from) continue;
                    const escaped = escapeRegExp(rule.from);
                    if (!escaped) continue;
                    const regex = new RegExp(escaped, "g");
                    const before = text;
                    text = text.replace(regex, rule.to || "");
                    if (before !== text) {
                        replaceCount++;
                        window.mengLog(`🧹 简单替换: ${rule.from}`);
                    }
                } catch(err) {
                    window.mengLog(`⚠️ 简单替换错误: ${rule.from}`);
                }
            }

            // 上下文删除
            for (const rule of settings.contextRules) {
                try {
                    if (!rule || !rule.enabled || !rule.pattern) continue;
                    const escaped = escapeRegExp(rule.pattern);
                    if (!escaped) continue;
                    const regex = new RegExp(escaped, "g");
                    const before = text;
                    text = text.replace(regex, "");
                    if (before !== text) {
                        replaceCount++;
                        window.mengLog(`✂️ Context 删除: ${rule.pattern}`);
                    }
                } catch(err) {
                    window.mengLog("⚠️ Context 删除失败");
                }
            }

            // 正则规则
            for (const rule of settings.regexRules) {
                try {
                    if (!rule || !rule.enabled || !rule.pattern) continue;
                    if (!rule._regex) {
                        try {
                            rule._regex = new RegExp(rule.pattern, rule.flags || "g");
                        } catch(e) {
                            window.mengLog(`⚠️ 无效正则: ${rule.pattern}`);
                            continue;
                        }
                    }
                    const before = text;
                    text = text.replace(rule._regex, rule.replace || "");
                    if (before !== text) {
                        replaceCount++;
                        window.mengLog(`⚙️ Regex 生效: ${rule.pattern}`);
                    }
                } catch(err) {
                    window.mengLog(`⚠️ Regex 执行失败: ${rule.pattern}`);
                }
            }

            // 句子优化（条件 + 使用可配置动作词）
            if (settings.enableSentenceOptimization) {
                const actionWords = settings.actionWords || ["盯着","看着","笑着","沉默着","站着"];
                const actionPattern = actionWords.join("|");

                text = text.replace(
                    new RegExp(`^(?:\\{\\{user\\}\\}|\\{\\{char\\}\\})?\\s*(?:${actionPattern})[。！？]?\\s*$`, "gm"), ""
                );
                text = text.replace(
                    new RegExp(`(?:^|[。！？；\\n])\\s*(?:\\{\\{user\\}\\}|\\{\\{char\\}\\})?\\s*(?:${actionPattern})[。！？；]?`, "g"), ""
                );
                text = text.replace(
                    new RegExp(`(?:^|[。！？；])\\s*(?:\\{\\{user\\}\\}|\\{\\{char\\}\\})?\\s*(?:${actionPattern})[，,]`, "g"), ""
                );
                text = text.replace(
                    new RegExp(`([。！？；]|^)[，,]\\s*(?:\\{\\{user\\}\\}|\\{\\{char\\}\\})?\\s*(?:${actionPattern})[，,]([。！？；]|$)`, "g"), "$1，$2"
                );
                text = text.replace(/^(像|仿佛|如同|宛若)[，。！？；,]*$/gm, "");
                text = text.replace(/(眼睛里|眼底里|眼中|眼眸中|空气中|空气里)/g, " ");

                // 标点压缩
                text = text.replace(/，\s*，/g, "，")
                    .replace(/。\s*。/g, "。").replace(/：\s*：/g, "：")
                    .replace(/，\s*。/g, "。").replace(/。\s*，/g, "，")
                    .replace(/,\s*\./g, ".").replace(/\.\s*,/g, ",")
                    .replace(/[，,]{2,}/g, "，").replace(/[。\.]{2,}/g, "。")
                    .replace(/[！!]{2,}/g, "！").replace(/[？?]{2,}/g, "？")
                    .replace(/^[，。！？；：]+/gm, "")
                    .replace(/[，。！？；：]\s*[，。！？；：]+/g, "。");

                text = text.replace(/^(他|她|它|自己|对方|空气|\{\{user\}\}|\{\{char\}\})[。！？,]*$/gm, "");
                text = text.replace(/\n{3,}/g, "\n\n");
                text = text.replace(/[ \t]{2,}/g, "");

                const sentences = text.split(/([。！？])/)
                    .reduce((acc, val, idx, arr) => {
                        if (/[。！？]/.test(val)) acc.push((arr[idx-1] || '') + val);
                        return acc;
                    }, [])
                    .map(s => s.trim()).filter(s => s.length > 0);

                let paragraph = [], paragraphs = [];
                for (let i = 0; i < sentences.length; i++) {
                    paragraph.push(sentences[i]);
                    const randLength = 2 + Math.floor(Math.random() * 3);
                    if (paragraph.length >= randLength || i === sentences.length - 1) {
                        paragraphs.push(paragraph.join(""));
                        paragraph = [];
                    }
                }
                text = paragraphs.join("\n\n");

                text = text.replace(
                    /[^a-zA-Z0-9\u4e00-\u9fa5，。！？、；：“”‘’（）《》〈〉【】『』…@\u{1F300}-\u{1FAFF}\s]/gu, ""
                );
            }

            // 恢复状态栏
            if (settings.protectStatusBar) {
                Object.keys(statusBarMap).forEach(token => {
                    text = text.replace(token, statusBarMap[token]);
                });
            }

            // 恢复变量/白名单
            if (settings.protectVariables) text = restoreVariables(text, varData.variableMap);
            if (settings.protectWhitelist) text = restoreWhitelist(text, whiteData.map);

            // URL/Email 保护 + 恢复
            text = text.replace(/(https?:\/\/[^\s]+)/g, m => `__MENG_URL__${safeBtoa(m)}__`);
            text = text.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+)/g, m => `__MENG_EMAIL__${safeBtoa(m)}__`);
            text = text.replace(/__MENG_URL__(.*?)__/g, (_, encoded) => { try { return safeAtob(encoded); } catch { return ""; } });
            text = text.replace(/__MENG_EMAIL__(.*?)__/g, (_, encoded) => { try { return safeAtob(encoded); } catch { return ""; } });

            // 安全结果
            if (typeof text !== "string") text = String(text || "");
            if (!text.trim()) {
                window.MengRuntime.cleanerWorking = false;
                return "";
            }

            setCache(arguments[0] || text, text);
            window.MengRuntime.lastCleanTime = Date.now();
            window.mengLog(`✅ 文本清洗完成 (${replaceCount} 项命中)`);
            window.MengRuntime.cleanerWorking = false;
            return text;

        } catch(err) {
            console.error("[梦晏晨 Cleaner] 崩溃:", err);
            window.mengLog(`💥 Cleaner崩溃: ${err.message || err}`);
            window.MengRuntime.cleanerWorking = false;
            try { return String(text || ""); } catch { return ""; }
        }
    }
};

window.MengCleanerAPI = {
    clean: window.MengCleaner.cleanText,
    cache: { getCache, setCache, clearCache }
};

console.log("[梦晏晨 Cleaner] ✅ Cleaner 模块加载完成");