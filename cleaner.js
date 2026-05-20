// ======================
// 完整优化版 MengCleaner
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
                if (matches?.length) {
                    console.log(`[梦晏晨] 上下文删除匹配:`, matches);
                }
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
            if (cleaned.includes(from)) {
                console.log(`[梦晏晨] 名字修正: "${from}" → "${to}"`);
            }
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
            if (cleaned.includes(rule.from)) {
                console.log(`[梦晏晨] 简单替换: "${rule.from}" → "${rule.to}"`);
            }
            cleaned = cleaned.replaceAll(rule.from, rule.to || "");
        }

        // ===== 句子清理 =====
        cleaned = cleaned
        // 段落空行压缩为单空行
        .replace(/\n{2,}/g, "\n\n")
        // 中文正文禁止空格
        .replace(/([^\x00-\x7F])\s+([^\x00-\x7F])/g, "$1$2")
        // 弱残句修复（不破坏句子）
        .replace(/(眼睛里|眼底里|眼中|眼眸中|空气中|空气里)/g, " ")
        // 删除像“像”“仿佛”等残缺连接词
        .replace(/^(像|仿佛|如同|宛若)\s*[，。！？；]?$/gm, "")
        // 删除动作残句（单行或单句）
        .replace(/^(?:\s*(?:\{\{user\}\}|\{\{char\}\})?\s*(盯着|看着|笑着|沉默着|站着)[。！？]?\s*)$/gm, "")
        .replace(/(?:^|\n)(?:\s*(?:\{\{user\}\}|\{\{char\}\})?\s*(盯着|看着|笑着|沉默着|站着)[。！？])(?:\s*|\n)/g, "")
        // 删除孤立代词残句
        .replace(/^(他|她|它|自己|对方|空气|\{\{user\}\}|\{\{char\}\})[。！？]?$/gm, "")
        // “的”修复
        .replace(/(?<=\S)的([，。])/g, "$1");

        // ===== 分段整理 =====
        cleaned = cleaned
            .split(/(?<=[。！？\n])/g) // 按句号/感叹号/问号/换行拆分
            .map(s => s.trim())
            .filter(s => {
                // 状态栏保护
                if (/^[A-Za-z]{1,10}[:：=]/.test(s)) return true;
                if (/MENGBLOCK\d+/.test(s)) return true;
                return s.length > 0;
            })
            // 段落式合并，每段之间空一行
            .reduce((acc, curr) => {
                if (!acc) return curr;
                // 如果上一段最后一个字符是换行，则直接接上
                if (acc.endsWith("\n\n")) return acc + curr;
                return acc + "\n\n" + curr;
            }, "")
            .replace(/[。]{2,}/g, "。"); // 多余句号压缩

        // ===== 删除奇葩字符 =====
        cleaned = cleaned.replace(
            /[^a-zA-Z0-9\u4e00-\u9fa5，。！？、；：“”‘’（）《》〈〉【】『』…@\u{1F300}-\u{1FAFF}\s]/gu,
            ""
        );

        console.log("[梦晏晨] 清洗后文本:", cleaned);
        console.log("[梦晏晨] === 清洗结束 ===");

        // ==== 状态栏/标签恢复 ====
        cleaned = cleaned.replace(/MENGBLOCK(\d+)/g, (_, i) => {
            return protectedBlocks[i];
        });

        // ==== user和char变量恢复 ====
        for (const [k,v] of Object.entries(variableMap)) {
            cleaned = cleaned.replaceAll(v, k);
        }

        return cleaned.trim();
    }
};

export { MengCleaner };