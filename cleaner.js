// ======================
// 优化版 MengCleaner 修复版
// ======================
const MengCleaner = {
    async cleanText(text, settings) {
        if (!text) return text;

        let cleaned = text;
        
        // ==== user和char变量保护 ====
        const variableMap = {
            "{{user}}": "MENGUSERTOKEN",
            "{{char}}": "MENGCHARTOKEN"
        };

        for (const [k,v] of Object.entries(variableMap)) {
            cleaned = cleaned.replaceAll(k, v);
        }
        
        // ===== 保护状态栏/XML/标签 =====
        const protectedBlocks = [];
        cleaned = cleaned.replace(
          /<([a-zA-Z\u4e00-\u9fa5][^>\s]*)[^>]*>[\s\S]*?<\/\1>|\[[^\]]*\]/g,
          (m) => {
              protectedBlocks.push(m);
              return `MENGBLOCK${protectedBlocks.length - 1}`;
          }
        );

        // ===== 文字提示 =====
        console.log("[梦晏晨] === 清洗开始 ===");
        console.log("[梦晏晨] 原文本:", text);

        // ⚠️ 安全挂载辅助数组
        if(!window.MengYanChen) window.MengYanChen = {};
        if(!window.MengYanChen.pendingConfirmations) window.MengYanChen.pendingConfirmations = [];
        if(!window.MengYanChen.correctNames) window.MengYanChen.correctNames = new Set();
        const { pendingConfirmations, correctNames } = window.MengYanChen;

        // ===== 上下文删除规则 =====
        const contextRules = settings.contextRules || [];
        for (const rule of contextRules) {
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

        // ===== 名字修正 =====
        for (const rule of settings.nameFixRules || []) {
             if (rule.enabled === false) continue;
             const from = rule.from;
             const to = rule.to;
             if (!from || !to) continue;
             if (cleaned.includes(from)) console.log(`[梦晏晨] 名字修正: "${from}" → "${to}"`);
             cleaned = cleaned.replaceAll(from, to);
        }

        // ===== regex规则 =====
        for (const rule of settings.regexRules || []) {
            if (!rule.enabled) continue;
            try {
                if (!rule._regex) rule._regex = new RegExp(rule.pattern, rule.flags || "g");
                const matches = cleaned.match(rule._regex);
                if (matches?.length) console.log(`[梦晏晨] 正则规则匹配: "${rule.pattern}"`, matches);
                cleaned = cleaned.replace(rule._regex, rule.replace ?? " ");
            } catch (err) {
                console.warn("[梦晏晨] regex规则错误:", rule.pattern, err);
            }
        }

        // ===== 简单替换 =====
        for (const rule of settings.simpleReplacements || []) {
            if (rule.enabled === false) continue;
            if (cleaned.includes(rule.from)) console.log(`[梦晏晨] 简单替换: "${rule.from}" → "${rule.to}"`);
            cleaned = cleaned.replaceAll(rule.from, rule.to || "");
        }

        // ===== 基础清理 =====
        cleaned = cleaned
            .replace(/\n{3,}/g, "\n\n")
            .replace(/[ \t]{2,}/g, " ")
            .replace(/\s+([，。！？])/g, "$1");

        // ===== 动作残句处理 =====
        const actionPattern = "[\\s\\S]*?"; // ⚠️ 默认值，防止报错
        cleaned = cleaned
            // 单独一行动作句
            .replace(new RegExp(`^(?:\\{\\{user\\}\\}|\\{\\{char\\}\\})?\\s*(?:${actionPattern})[。！？]?\\s*$`, "gm"), "")
            // 单独一句
            .replace(new RegExp(`(?:^|[。！？；\\n])\\s*(?:\\{\\{user\\}\\}|\\{\\{char\\}\\})?\\s*(?:${actionPattern})[。！？；]?`, "g"), "")
            // 半句开头动作句
            .replace(new RegExp(`(?:^|[。！？；])\\s*(?:\\{\\{user\\}\\}|\\{\\{char\\}\\})?\\s*(?:${actionPattern})[，,]`, "g"), "")
            // 句中残留动作句
            .replace(new RegExp(`([。！？；]|^)[，,]\\s*(?:\\{\\{user\\}\\}|\\{\\{char\\}\\})?\\s*(?:${actionPattern})[，,]([。！？；]|$)`, "g"), "$1，$2")
            // 盯着/看着类短句
            .replace(/^(盯着|看着|注视着|凝视着)\s*$/gm, "")
            // “像”“仿佛”等残缺连接词
            .replace(/^(像|仿佛|如同|宛若)\s*[，。！？；]?$/gm, "")
            // 改成弱处理（不破坏句子）
            .replace(/(眼睛里|眼底里|眼中|眼眸中|空气中|空气里)/g, " ")
            // “的”修复
            .replace(/的([，。])/g, "$1");

        // ===== 删除奇葩字符 =====
        cleaned = cleaned.replace(/[^a-zA-Z0-9\u4e00-\u9fa5，。！？、；：“”‘’（）《》〈〉【】『』…@\u{1F300}-\u{1FAFF}\s]/gu, "");

        // ===== 恢复状态块 =====
        cleaned = cleaned.replace(/MENGBLOCK(\d+)/g, (_, i) => protectedBlocks[i]);

        // ===== user/char恢复 =====
        for (const [k,v] of Object.entries(variableMap)) {
            cleaned = cleaned.replaceAll(v, k);
        }

        // ===== 分段处理 =====
        const sentences = cleaned.split(/([。！？])/)
            .reduce((acc, val, idx, arr) => {
                if (/[。！？]/.test(val)) acc.push((arr[idx-1] || '') + val);
                return acc;
            }, [])
            .map(s => s.trim())
            .filter(s => s.length > 0);

        let paragraph = [];
        let paragraphs = [];
        for (let i = 0; i < sentences.length; i++) {
            paragraph.push(sentences[i]);
            const randLength = 2 + Math.floor(Math.random() * 3); // 2~4句
            if (paragraph.length >= randLength || i === sentences.length - 1) {
                paragraphs.push(paragraph.join(""));
                paragraph = [];
            }
        }
        cleaned = paragraphs.join("\n\n");

        console.log("[梦晏晨] 清洗后文本:", cleaned);
        console.log("[梦晏晨] === 清洗结束 ===");

        return cleaned.trim();
    }
};

export { MengCleaner };