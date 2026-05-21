// ======================
// 梦晏晨 Cleaner Cache
// ======================

const MENG_CACHE = new Map();
const MAX_CACHE_SIZE = 500;

function getCache(text) {
    try {
        if (!text) return null;
        if (MENG_CACHE.has(text)) {
            console.log("[梦晏晨 Cleaner] ⚡ 命中缓存");
            return MENG_CACHE.get(text);
        }
    } catch(err) {}
    return null;
}

function setCache(original, cleaned) {
    try {
        if (!original || typeof original !== "string") return;
        if (MENG_CACHE.size >= MAX_CACHE_SIZE) {
            const firstKey = MENG_CACHE.keys().next().value;
            MENG_CACHE.delete(firstKey);
            console.log("[梦晏晨 Cleaner] 🧹 自动清理旧缓存");
        }
        MENG_CACHE.set(original, cleaned);
    } catch(err) {}
}

function clearCache() {
    try {
        MENG_CACHE.clear();
        console.log("[梦晏晨 Cleaner] ♻️ 缓存已清空");
    } catch(err) {}
}

function getCacheInfo() {
    return { size: MENG_CACHE.size, max: MAX_CACHE_SIZE };
}

// ======================
// 梦晏晨 Cleaner Ultimate
// ======================

console.log("[梦晏晨 Cleaner] 模块开始加载...");

window.MengYanChen = window.MengYanChen || {};
window.MengLogs = window.MengLogs || [];
window.MengRuntime = window.MengRuntime || {};

window.MengRuntime.cleanerLoaded = false;
window.MengRuntime.cleanerWorking = false;
window.MengRuntime.lastCleanTime = 0;

window.mengLog = window.mengLog || function(message, type = "log") {
    const time = new Date().toLocaleTimeString();
    const finalMsg = `🕒 [${time}] ${message}`;
    window.MengLogs.push(finalMsg);
    if (window.MengLogs.length > 500) window.MengLogs.shift();
    const liveLog = document.querySelector("#meng-live-log");
    if (liveLog) {
        liveLog.textContent += finalMsg + "\n";
        liveLog.scrollTop = liveLog.scrollHeight;
    }
    console[type]("[梦晏晨 Cleaner]", message);
};

window.mengToast = window.mengToast || function(msg) {
    try {
        if (window.toastr) toastr.success(msg);
        else console.log("[Toast]", msg);
    } catch(err) {}
    window.mengLog(msg);
};

function escapeRegExp(str = "") {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeSliceText(text, limit = 500000) {
    if (!text) return "";
    const chars = Array.from(text);
    if (chars.length <= limit) return text;
    window.mengLog(`⚠️ 文本过长，已截断 (原${chars.length}字符)`);
    return chars.slice(0, limit).join('');
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
    for (const key in map) {
        text = text.split(key).join(map[key]);
    }
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
    for (const key in variableMap) {
        text = text.split(key).join(variableMap[key]);
    }
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

            text = safeSliceText(String(text));

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

            // 状态栏/XML/标签保护（条件）
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

            settings.nameFixRules = Array.isArray(settings.nameFixRules) ? settings.nameFixRules : [];
            settings.simpleReplacements = Array.isArray(settings.simpleReplacements) ? settings.simpleReplacements : [];
            settings.regexRules = Array.isArray(settings.regexRules) ? settings.regexRules : [];
            settings.contextRules = Array.isArray(settings.contextRules) ? settings.contextRules : [];

            let replaceCount = 0;

            for (const rule of settings.nameFixRules) { /* 不变 */ }
            for (const rule of settings.simpleReplacements) { /* 不变 */ }
            for (const rule of settings.contextRules) { /* 不变 */ }
            for (const rule of settings.regexRules) { /* 不变 */ }

            // 句子优化（条件 + 使用 settings.actionWords）
            if (settings.enableSentenceOptimization) {
                const actionWords = settings.actionWords || ["盯着","看着","笑着","沉默着","站着"];
                const actionPattern = actionWords.join("|");

                cleaned = cleaned.replace(
                    new RegExp(`^(?:\\{\\{user\\}\\}|\\{\\{char\\}\\})?\\s*(?:${actionPattern})[。！？]?\\s*$`, "gm"),
                    ""
                );
                cleaned = cleaned.replace(
                    new RegExp(`(?:^|[。！？；\\n])\\s*(?:\\{\\{user\\}\\}|\\{\\{char\\}\\})?\\s*(?:${actionPattern})[。！？；]?`, "g"),
                    ""
                );
                cleaned = cleaned.replace(
                    new RegExp(`(?:^|[。！？；])\\s*(?:\\{\\{user\\}\\}|\\{\\{char\\}\\})?\\s*(?:${actionPattern})[，,]`, "g"),
                    ""
                );
                cleaned = cleaned.replace(
                    new RegExp(`([。！？；]|^)[，,]\\s*(?:\\{\\{user\\}\\}|\\{\\{char\\}\\})?\\s*(?:${actionPattern})[，,]([。！？；]|$)`, "g"),
                    "$1，$2"
                );
                cleaned = cleaned.replace(/^(像|仿佛|如同|宛若)[，。！？；,]*$/gm, "");
                cleaned = cleaned.replace(/(眼睛里|眼底里|眼中|眼眸中|空气中|空气里)/g, " ");

                cleaned = cleaned
                    .replace(/，\s*，/g, "，")
                    .replace(/。\s*。/g, "。")
                    .replace(/：\s*：/g, "：")
                    .replace(/，\s*。/g, "。")
                    .replace(/。\s*，/g, "，")
                    .replace(/,\s*\./g, ".")
                    .replace(/\.\s*,/g, ",")
                    .replace(/[，,]{2,}/g, "，")
                    .replace(/[。\.]{2,}/g, "。")
                    .replace(/[！!]{2,}/g, "！")
                    .replace(/[？?]{2,}/g, "？")
                    .replace(/^[，。！？；：]+/gm, "")
                    .replace(/[，。！？；：]\s*[，。！？；：]+/g, "。");

                cleaned = cleaned.replace(/^(他|她|它|自己|对方|空气|\{\{user\}\}|\{\{char\}\})[。！？,]*$/gm, "");
                cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
                cleaned = cleaned.replace(/[ \t]{2,}/g, "");

                const sentences = cleaned.split(/([。！？])/)
                    .reduce((acc, val, idx, arr) => {
                        if (/[。！？]/.test(val)) {
                            acc.push((arr[idx-1] || '') + val);
                        }
                        return acc;
                    }, [])
                    .map(s => s.trim())
                    .filter(s => s.length > 0);

                let paragraph = [];
                let paragraphs = [];
                for (let i = 0; i < sentences.length; i++) {
                    paragraph.push(sentences[i]);
                    const randLength = 2 + Math.floor(Math.random() * 3);
                    if (paragraph.length >= randLength || i === sentences.length - 1) {
                        paragraphs.push(paragraph.join(""));
                        paragraph = [];
                    }
                }
                cleaned = paragraphs.join("\n\n");

                cleaned = cleaned.replace(
                    /[^a-zA-Z0-9\u4e00-\u9fa5，。！？、；：“”‘’（）《》〈〉【】『』…@\u{1F300}-\u{1FAFF}\s]/gu,
                    ""
                );
            }

            // 恢复状态栏
            if (settings.protectStatusBar) {
                Object.keys(statusBarMap).forEach(token => {
                    text = text.replace(token, statusBarMap[token]);
                });
            }

            // 恢复变量/白名单
            if (settings.protectVariables) {
                text = restoreVariables(text, varData.variableMap);
            }
            if (settings.protectWhitelist) {
                text = restoreWhitelist(text, whiteData.map);
            }

            // ... 后续 URL/Email 恢复等不变
            // 缓存写入
            setCache(arguments[0] || text, text);
            window.MengRuntime.lastCleanTime = Date.now();
            window.mengLog(`✅ 文本清洗完成 (${replaceCount} 项命中)`);
            window.MengRuntime.cleanerWorking = false;
            return text;
        } catch(err) {
            console.error("[梦晏晨 Cleaner] 崩溃:", err);
            window.mengLog(`💥 Cleaner崩溃: ${err.message || err}`);
            window.MengRuntime.cleanerWorking = false;
            try {
                return String(text || "");
            } catch {
                return "";
            }
        }
    }
};

window.MengRuntime.cleanerLoaded = true;
window.mengLog("✅ Cleaner 模块加载完成");
window.mengLog("🧠 AI名字学习系统已启动");
window.mengLog("🛡️ 白名单保护系统已启动");
window.mengLog("⚙️ Regex 安全编译系统已启动");
window.mengLog("📦 变量保护系统已启动");
window.mengLog("🔒 Cleaner 崩溃保护已启动");
window.mengLog("💾 文本缓存已启用");
window.mengLog("✨ Ultimate Cleaner Ready");

window.MengCleanerAPI = {
    clean: window.MengCleaner.cleanText,
    cache: { getCache, setCache, clearCache, getCacheInfo }
};