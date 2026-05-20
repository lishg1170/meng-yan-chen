// ==========================
// 梦晏晨CleanerCache cleaner.js
// ===========================

const MENG_CACHE = new Map();
const MAX_CACHE_SIZE = 500;

function getCache(text) {
    try {
        if (!text) return null;
        if (MENG_CACHE.has(text)) {
            console.log("[梦晏晨 Cleaner] ⚡ 命中缓存");
            return MENG_CACHE.get(text);
        }
    } catch(err) {
        console.warn("[梦晏晨 Cleaner] 获取缓存失败", err);
    }
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
    } catch(err) {
        console.warn("[梦晏晨 Cleaner] 写入缓存失败", err);
    }
}

function clearCache() {
    try {
        MENG_CACHE.clear();
        console.log("[梦晏晨 Cleaner] ♻️ 缓存已清空");
    } catch(err) {
        console.warn("[梦晏晨 Cleaner] 清空缓存失败", err);
    }
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

// ===== 日志函数（条件定义，避免覆盖全局） =====
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

// ===== Toast（条件定义） =====
window.mengToast = window.mengToast || function(msg) {
    try {
        if (window.toastr) toastr.success(msg);
        else console.log("[Toast]", msg);
    } catch(err) {
        console.warn("[梦晏晨] toast失败", err);
    }
    window.mengLog(msg);
};

// ===== 安全正则转义 =====
function escapeRegExp(str = "") {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ===== 安全截断文本（避免代理对截断） =====
function safeSliceText(text, limit = 500000) {
    if (!text) return "";
    // 使用 Array.from 安全计算实际码点
    const chars = Array.from(text);
    if (chars.length <= limit) return text;
    window.mengLog(`⚠️ 文本过长，已截断 (原${chars.length}字符)`);
    return chars.slice(0, limit).join('');
}

// ===== 白名单 =====
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

function restoreVariables(text, variableMap = {}) {
    for (const key in variableMap) {
        text = text.split(key).join(variableMap[key]);
    }
    return text;
}

// ===== 安全 base64（支持 Unicode） =====
function safeBtoa(str) {
    try {
        // 将字符串转为 UTF-8 字节数组再转 base64
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        const binaryString = String.fromCharCode(...bytes);
        return btoa(binaryString);
    } catch(e) {
        console.warn("[梦晏晨 Cleaner] base64编码失败", e);
        // 降级为直接编码（可能报错）
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
        console.warn("[梦晏晨 Cleaner] base64解码失败", e);
        // 降级
        return decodeURIComponent(escape(atob(encoded)));
    }
}

// ===== 主 Cleaner 对象 =====
window.MengCleaner = {
    version: "Ultimate v3",

    async cleanText(text, settings = {}) {
        try {
            if (!text) return text;

            // ===== 缓存检查 =====
            const cached = getCache(text);
            if (cached !== null) return cached;

            // ===== 防止重入 =====
            if (window.MengRuntime.cleanerWorking) {
                window.mengLog("⚠️ Cleaner 正在运行，跳过重复调用");
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

            window.mengLog("🧠 开始执行文本清洗");

            // ======================
            // 规则初始化
            // ======================
            settings.nameFixRules = Array.isArray(settings.nameFixRules) ? settings.nameFixRules : [];
            settings.simpleReplacements = Array.isArray(settings.simpleReplacements) ? settings.simpleReplacements : [];
            settings.regexRules = Array.isArray(settings.regexRules) ? settings.regexRules : [];
            settings.contextRules = Array.isArray(settings.contextRules) ? settings.contextRules : [];

            let replaceCount = 0;

            // ===== 名字修正 =====
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

            // ===== 简单替换 =====
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

            // ===== Context 删除 =====
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

            // ===== 正则规则（使用预编译缓存） =====
            for (const rule of settings.regexRules) {
                try {
                    if (!rule || !rule.enabled || !rule.pattern) continue;
                    if (!rule._regex) {
                        rule._regex = (() => {
                            try {
                                return new RegExp(rule.pattern, rule.flags || "g");
                            } catch(e) {
                                window.mengLog(`⚠️ 无效正则: ${rule.pattern}`);
                                return null;
                            }
                        })();
                    }
                    if (!rule._regex) continue;
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

            // ======================
            // AI 名字学习系统
            // ======================
            window.MengYanChen.correctNames = window.MengYanChen.correctNames || new Set();
            window.MengYanChen.pendingConfirmations = window.MengYanChen.pendingConfirmations || [];

            const chineseNameRegex = /[\u4e00-\u9fa5]{2,4}/g;
            const foundNames = text.match(chineseNameRegex) || [];
            const commonWords = new Set([
                "自己", "我们", "他们", "你们", "少女", "少年", "女人", "男人",
                "东西", "时候", "感觉", "地方", "眼睛", "眸子", "身体", "声音",
                "空气", "表情", "呼吸", "系统", "宿主", "主人", "哥哥", "姐姐",
                "宝宝", "妈咪", "爹地", "先生", "小姐", "医生", "老师",
            ]);

            for (const word of foundNames) {
                try {
                    if (!word) continue;
                    if (commonWords.has(word)) continue;
                    if (window.MengYanChen.correctNames.has(word)) continue;
                    const alreadyPending = window.MengYanChen.pendingConfirmations.some(i => i.correct === word);
                    if (alreadyPending) continue;
                    window.MengYanChen.pendingConfirmations.push({ wrong: "待确认", correct: word });
                    window.mengLog(`🧠 发现疑似新名字: ${word}`);
                } catch(err) {
                    window.mengLog("⚠️ 名字学习失败");
                }
            }

            // ======================
            // AI 防误伤系统
            // ======================
            text = text.replace(/([。！？,\.\?!]){3,}/g, "$1");
            text = text.replace(/[ \t]{4,}/g, " ");
            text = text.replace(/\n{4,}/g, "\n\n");
            text = text.replace(/```{2,}/g, "```");
            text = text.replace(/"\s*:\s*,/g, '":"",');
            text = text.replace(/\bundefined\b/g, "");
            text = text.replace(/\bnull\b/g, "");

            // ======================
            // URL / Email 保护（安全 base64）
            // ======================
            text = text.replace(/(https?:\/\/[^\s]+)/g, m => `__MENG_URL__${safeBtoa(m)}__`);
            text = text.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+)/g, m => `__MENG_EMAIL__${safeBtoa(m)}__`);

            window.mengLog(`✨ 当前累计规则命中: ${replaceCount}`);

            // ======================
            // 恢复 URL / Email
            // ======================
            text = text.replace(/__MENG_URL__(.*?)__/g, (_, encoded) => {
                try { return safeAtob(encoded); } catch { return ""; }
            });
            text = text.replace(/__MENG_EMAIL__(.*?)__/g, (_, encoded) => {
                try { return safeAtob(encoded); } catch { return ""; }
            });

            // ===== 变量恢复 =====
            text = restoreVariables(text, varData.variableMap);
            // ===== 白名单恢复 =====
            text = restoreWhitelist(text, whiteData.map);

            // ======================
            // 二次安全修复
            // ======================
            text = text.normalize("NFC");
            text = text.replace(/^\uFEFF/, "");
            text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
            text = text.replace(/\s{20,}/g, " ");

            // ===== 结果检查 =====
            if (typeof text !== "string") {
                window.mengLog("⚠️ cleanText 输出异常，已回退");
                text = String(text || "");
            }
            if (!text.trim()) {
                window.mengLog("⚠️ 清洗后文本为空，已阻止覆盖");
                window.MengRuntime.cleanerWorking = false;
                return "";  // 不缓存空结果
            }

            // ===== 写入缓存 =====
            setCache(text, text);  // 缓存清洗结果（注意：key 是原始文本，但这里 text 已经是清洗后的，原始输入在原变量中已丢失，需调整）
            // 修正：应使用原始输入字符串作为缓存键
            const originalInput = arguments[0]; // 保存原始输入引用
            if (originalInput && originalInput !== text) {
                setCache(originalInput, text);
            }

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

// ===== 启动标记 =====
window.MengRuntime.cleanerLoaded = true;
window.mengLog("✅ Cleaner 模块加载完成");
window.mengLog("🧠 AI名字学习系统已启动");
window.mengLog("🛡️ 白名单保护系统已启动");
window.mengLog("⚙️ Regex 安全编译系统已启动");
window.mengLog("📦 变量保护系统已启动");
window.mengLog("🔒 Cleaner 崩溃保护已启动");
window.mengLog("💾 文本缓存已启用");
window.mengLog("✨ Ultimate Cleaner Ready");

// ===== 暴露 API =====
window.MengCleanerAPI = {
    clean: window.MengCleaner.cleanText,
    cache: { getCache, setCache, clearCache, getCacheInfo }
};