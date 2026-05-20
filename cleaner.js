// ======================
// 优化版 MengCleaner（严格段落版）
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

        for (const [k, v] of Object.entries(variableMap)) {
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
        if (!window.MengYanChen) window.MengYanChen = {};
        if (!window.MengYanChen.pendingConfirmations) window.MengYanChen.pendingConfirmations = [];
        if (!window.MengYanChen.correctNames) window.MengYanChen.correctNames = new Set();
        const { pendingConfirmations, correctNames } = window.MengYanChen;

        //
        // 0️⃣ 上下文删除规则
        //
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

        //
        // 1️⃣ 名字修正
        //
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

        //
        // 2️⃣ regex规则
        //
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

        //
        // 3️⃣ 简单替换
        //
        for (const rule of settings.simpleReplacements || []) {
            if (rule.enabled === false) continue;
            if (cleaned.includes(rule.from)) {
                console.log(`[梦晏晨] 简单替换: "${rule.from}" → "${rule.to}"`);
            }
            cleaned = cleaned.replaceAll(rule.from, rule.to || "");
        }

        //
        // 4️⃣ 句子清理（严格段落版）
        //
        cleaned = cleaned
            // ===== 基础清理 =====
            .replace(/\n{3,}/g, "\n\n") // 多空行压缩为 2 行
            // 正文不允许空格，删除中文间多余空格，但保留状态栏（用保护块）
            .replace(/([^\nA-Za-z0-9MENGUSERTOKENMENGCHARTOKEN])\s+([^\nA-Za-z0-9MENGUSERTOKENMENGCHARTOKEN])/g, "$1$2")

            // ===== 残句修复 =====
            .replace(/(眼睛里|眼底里|眼中|眼眸中|空气中|空气里)/g, " ")

            // 超短动作句
            .replace(/^(?:\{\{user\}\}|\{\{char\}\})?\s*(盯着|看着|笑着|沉默着|站着)[。！？]?\s*$/gm, "")

            // 残缺连接词
            .replace(/^(像|仿佛|如同|宛若)\s*[，。！？；]?$/gm, "")

            // ===== 标点修复 =====
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
            .replace(/[，。！？；：]\s*[，。！？；：]+/g, "。")

            // ===== 动作残句 =====
            .replace(/^(他|她|它|自己|对方|空气|\{\{user\}\}|\{\{char\}\})[。！？]?$/gm, "")

            // ===== “的”修复 =====
            .replace(/(?<=\S)的([，。])/g, "$1")

        // ===== 段落拆分与空行处理 =====
        cleaned = cleaned
            .split(/(?<=[。！？\n])/g) // 按句号/感叹号/问号/换行拆分，同时保留标点
            .map(s => s.trim()) // 去掉首尾空格
            .filter(s => s.length > 0) // 保留有效文本
            .map((s, i, arr) => {
                // 段落规则：连续句子不空行，段落之间空一行
                const next = arr[i + 1];
                if (next && !next.startsWith("MENGBLOCK") && !/^[A-Za-z]{1,10}[:：=]/.test(next)) {
                    return s + "\n";
                }
                return s;
            })
            .join("\n") // 段落之间空一行

            // 压缩多余空行为单行空行
            .replace(/\n{3,}/g, "\n\n");

        //
        // 5️⃣ 删除奇葩字符（保留中文、英文、数字、标点、表情、状态栏）
        //
        cleaned = cleaned.replace(
            /[^a-zA-Z0-9\u4e00-\u9fa5，。！？、；：“”‘’（）《》〈〉【】『』…@\u{1F300}-\u{1FAFF}\s]/gu,
            ""
        );

        console.log("[梦晏晨] 清洗后文本:", cleaned);
        console.log("[梦晏晨] === 清洗结束 ===");

        // ==== 状态栏/标签恢复 ====
        cleaned = cleaned.replace(/MENGBLOCK(\d+)/g, (_, i) => protectedBlocks[i]);

        // ==== user和char变量恢复 ====
        for (const [k, v] of Object.entries(variableMap)) {
            cleaned = cleaned.replaceAll(v, k);
        }

        return cleaned.trim();
    }
};

export { MengCleaner };