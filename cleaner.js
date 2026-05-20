// MengCleaner.js
import RuleManager from "./ruleManager.js";

const MengCleaner = {
    _rulesCache: [],

    // ==== 初始化：加载规则 & 注册更新回调 ====
    async init() {
        try {
            // 初始加载
            this._rulesCache = await RuleManager.loadRules();
            console.log("[梦晏晨 MengCleaner] 初始规则加载完成，数量:", this._rulesCache.length);

            // 注册规则更新回调
            RuleManager.registerUpdateCallback((newRules) => {
                this._rulesCache = newRules;
                console.log("[梦晏晨 MengCleaner] 已刷新内部规则缓存:", newRules.length);
            });

        } catch (err) {
            console.error("[梦晏晨 MengCleaner] init 错误 ❌", err);
        }
    },

    // ==== 清理文本 ====
    async cleanText(text, settings = {}) {
        if (!text) return text;

        let cleaned = text;

        // ==== 1️⃣ user和char变量保护 ====
        const variableMap = {
            "{{user}}": "MENGUSERTOKEN",
            "{{char}}": "MENGCHARTOKEN"
        };
        for (const [k, v] of Object.entries(variableMap)) {
            cleaned = cleaned.replaceAll(k, v);
        }

        // ==== 2️⃣ 保护状态栏/XML/标签 ====
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
                const fullRegex = new RegExp(`([^。！？；\\n]*${rule.pattern}[^。！？；\\n]*)`, 'g');
                const matches = cleaned.match(fullRegex);
                if (matches?.length) console.log(`[梦晏晨] 上下文删除匹配:`, matches);
                cleaned = cleaned.replace(fullRegex, ' ');
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

        // ==== 8️⃣ 句子清理 & 动作句删除 ====
        const actionWords = ["盯着","看着","笑着","沉默着","站着"];
        const actionPattern = actionWords.join("|");

        // 单独一行动作句
        cleaned = cleaned.replace(
            new RegExp(`^(?:${Object.keys(variableMap).join("|")})?\\s*(?:${actionPattern})[。！？]?\\s*$`, "gm"),
            ""
        );
        // 单独一句
        cleaned = cleaned.replace(
            new RegExp(`(?:^|[。！？；\\n])\\s*(?:${Object.keys(variableMap).join("|")})?\\s*(?:${actionPattern})[。！？；]?`, "g"),
            ""
        );
        // 半句开头动作句
        cleaned = cleaned.replace(
            new RegExp(`(?:^|[。！？；])\\s*(?:${Object.keys(variableMap).join("|")})?\\s*(?:${actionPattern})[，,]`, "g"),
            ""
        );
        // 句中残留动作句
        cleaned = cleaned.replace(
            new RegExp(`([。！？；]|^)[，,]\\s*(?:${Object.keys(variableMap).join("|")})?\\s*(?:${actionPattern})[，,]([。！？；]|$)`, "g"),
            "$1，$2"
        );

        // 删除残缺连接词
        cleaned = cleaned.replace(/^(像|仿佛|如同|宛若)[，。！？；,]*$/gm, "");
        cleaned = cleaned.replace(/(眼睛里|眼底里|眼中|眼眸中|空气中|空气里)/g, " ");

        // ==== 9️⃣ 标点压缩 ====
        cleaned = cleaned
            .replace(/，\s*，/g, "，")
            .replace(/。\s*。/g, "。")
            .replace(/：\s*：/g, "：")
            .replace(/[，。！？；：]{2,}/g, "。")
            .replace(/[！!]{2,}/g, "！")
            .replace(/[？?]{2,}/g, "？")
            .replace(/^[，。！？；：]+/gm, "");

        // 删除孤立代词/动作残句
        cleaned = cleaned.replace(/^(他|她|它|自己|对方|空气|\{\{user\}\}|\{\{char\}\})[。！？,]*$/gm, "");

        // ==== 10️⃣ 多空行压缩 & 自然段 ====
        cleaned = cleaned.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, "");

        const sentences = cleaned.split(/([。！？])/)
            .reduce((acc, val, idx, arr) => {
                if (/[。！？]/.test(val)) acc.push((arr[idx-1] || '') + val);
                return acc;
            }, [])
            .map(s => s.trim()).filter(s => s.length > 0);

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

        // ==== 11️⃣ 删除奇葩字符 ====
        cleaned = cleaned.replace(
            /[^a-zA-Z0-9\u4e00-\u9fa5，。！？、；：“”‘’（）《》〈〉【】『』…@\u{1F300}-\u{1FAFF}\s]/gu,
            ""
        );

        // ==== 12️⃣ 状态栏/标签恢复 ====
        cleaned = cleaned.replace(/MENGBLOCK(\d+)/g, (_, i) => protectedBlocks[i]);

        // ==== 13️⃣ user/char 恢复 ====
        for (const [k, v] of Object.entries(variableMap)) {
            cleaned = cleaned.replaceAll(v, k);
        }

        return cleaned.trim();
    }
};

export { MengCleaner };