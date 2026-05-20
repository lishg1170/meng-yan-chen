// MengCleaner.js
(function(window) {
    const MengCleaner = {
        _rulesCache: [],

        // ===== 初始化 =====
        async init() {
            try {
                console.log("[梦晏晨 MengCleaner] 初始化中...");

                // 如果 RuleManager 已经挂载，立即加载规则
                if (window.MengRuleManager) {
                    this._rulesCache = await window.MengRuleManager.loadRules();
                    console.log("[梦晏晨 MengCleaner] 已加载 RuleManager 规则 ✅", this._rulesCache.length);

                    // 注册回调更新缓存
                    window.MengRuleManager.registerUpdateCallback((newRules) => {
                        this._rulesCache = newRules;
                        console.log("[梦晏晨 MengCleaner] RuleManager 更新规则缓存 ✅", newRules);
                    });
                } else {
                    console.log("[梦晏晨 MengCleaner] RuleManager 未就绪，先初始化空规则缓存");
                    this._rulesCache = [];
                }
            } catch (err) {
                console.error("[梦晏晨 MengCleaner] 初始化失败 ❌", err);
                this._rulesCache = [];
            }
        },

        // ===== 核心清理函数 =====
        async cleanText(text, settings = {}) {
            if (!text) return text;

            let cleaned = text;

            // ==== 1️⃣ user/char 变量保护 ====
            const variableMap = {
                "{{user}}": "MENGUSERTOKEN",
                "{{char}}": "MENGCHARTOKEN"
            };
            for (const [k, v] of Object.entries(variableMap)) {
                cleaned = cleaned.replaceAll(k, v);
            }

            // ==== 2️⃣ 保护 HTML/XML/标签/方括号 ====
            const protectedBlocks = [];
            cleaned = cleaned.replace(
                /<([a-zA-Z\u4e00-\u9fa5][^>\s]*)[^>]*>[\s\S]*?<\/\1>|\[[^\]]*\]/g,
                (m) => {
                    protectedBlocks.push(m);
                    return `MENGBLOCK${protectedBlocks.length - 1}`;
                }
            );

            // ==== 3️⃣ 合并规则 ====
            const mergedSettings = {
                nameFixRules: settings.nameFixRules || this._rulesCache.filter(r => r.type === "nameFix"),
                regexRules: settings.regexRules || this._rulesCache.filter(r => r.type === "regex"),
                simpleReplacements: settings.simpleReplacements || this._rulesCache.filter(r => r.type === "simple"),
                contextRules: settings.contextRules || this._rulesCache.filter(r => r.type === "context")
            };

            // ==== 4️⃣ 上下文删除规则 ====
            for (const rule of mergedSettings.contextRules) {
                if (!rule.enabled) continue;
                try {
                    const regex = new RegExp(`([^。！？；\\n]*${rule.pattern}[^。！？；\\n]*)`, 'g');
                    const matches = cleaned.match(regex);
                    if (matches?.length) console.log(`[梦晏晨] 上下文匹配:`, matches);
                    cleaned = cleaned.replace(regex, ' ');
                } catch (err) {
                    console.warn("[梦晏晨] 上下文规则错误:", rule.pattern, err);
                }
            }

            // ==== 5️⃣ 名字修正 ====
            for (const rule of mergedSettings.nameFixRules) {
                if (rule.enabled === false) continue;
                const { from, to } = rule;
                if (!from || !to) continue;
                if (cleaned.includes(from)) console.log(`[梦晏晨] 名字修正: "${from}" → "${to}"`);
                cleaned = cleaned.replaceAll(from, to);
            }

            // ==== 6️⃣ regex规则 ====
            for (const rule of mergedSettings.regexRules) {
                if (!rule.enabled) continue;
                try {
                    if (!rule._regex) rule._regex = new RegExp(rule.pattern, rule.flags || "g");
                    const matches = cleaned.match(rule._regex);
                    if (matches?.length) console.log(`[梦晏晨] 正则匹配: "${rule.pattern}"`, matches);
                    cleaned = cleaned.replace(rule._regex, rule.replace ?? " ");
                } catch (err) {
                    console.warn("[梦晏晨] regex规则错误:", rule.pattern, err);
                }
            }

            // ==== 7️⃣ 简单替换 ====
            for (const rule of mergedSettings.simpleReplacements) {
                if (rule.enabled === false) continue;
                if (cleaned.includes(rule.from)) console.log(`[梦晏晨] 简单替换: "${rule.from}" → "${rule.to}"`);
                cleaned = cleaned.replaceAll(rule.from, rule.to || "");
            }

            // ==== 8️⃣ 动作/残句清理 & 标点压缩 ====
            const actionWords = ["盯着","看着","笑着","沉默着","站着"];
            const actionPattern = actionWords.join("|");

            cleaned = cleaned.replace(new RegExp(`^(?:${Object.keys(variableMap).join("|")})?\\s*(?:${actionPattern})[。！？]?\\s*$`, "gm"), "");
            cleaned = cleaned.replace(new RegExp(`([。！？；]|^)[，,]\\s*(?:${Object.keys(variableMap).join("|")})?\\s*(?:${actionPattern})[，,]([。！？；]|$)`, "g"), "$1，$2");

            cleaned = cleaned.replace(/^(他|她|它|自己|对方|空气|\{\{user\}\}|\{\{char\}\})[。！？,]*$/gm, "");
            cleaned = cleaned.replace(/(眼睛里|眼底里|眼中|眼眸中|空气中|空气里)/g, " ");

            cleaned = cleaned
                .replace(/[，,]{2,}/g, "，")
                .replace(/[。\.]{2,}/g, "。")
                .replace(/[！!]{2,}/g, "！")
                .replace(/[？?]{2,}/g, "？")
                .replace(/^[，。！？；：]+/gm, "")
                .replace(/[，。！？；：]\s*[，。！？；：]+/g, "。");

            // ==== 9️⃣ 多空行压缩 & 分段 ====
            cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
            cleaned = cleaned.replace(/[ \t]{2,}/g, "");

            const sentences = cleaned.split(/([。！？])/).reduce((acc, val, idx, arr) => {
                if (/[。！？]/.test(val)) acc.push((arr[idx-1] || '') + val);
                return acc;
            }, []).map(s => s.trim()).filter(s => s.length > 0);

            let paragraphs = [], para = [];
            for (let i = 0; i < sentences.length; i++) {
                para.push(sentences[i]);
                if (para.length >= (2 + Math.floor(Math.random() * 3)) || i === sentences.length - 1) {
                    paragraphs.push(para.join(""));
                    para = [];
                }
            }
            cleaned = paragraphs.join("\n\n");

            // ==== 10️⃣ 删除奇怪字符 ====
            cleaned = cleaned.replace(/[^a-zA-Z0-9\u4e00-\u9fa5，。！？、；：“”‘’（）《》〈〉【】『』…@\u{1F300}-\u{1FAFF}\s]/gu, "");

            // ==== 11️⃣ 恢复保护块 ====
            cleaned = cleaned.replace(/MENGBLOCK(\d+)/g, (_, i) => protectedBlocks[i]);

            // ==== 12️⃣ 恢复 user/char 变量 ====
            for (const [k, v] of Object.entries(variableMap)) {
                cleaned = cleaned.replaceAll(v, k);
            }

            return cleaned.trim();
        }
    };

    // 挂载到全局
    window.MengCleaner = MengCleaner;
    console.log("[梦晏晨 MengCleaner] 已挂载到 window ✅");
})(window);