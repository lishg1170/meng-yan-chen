// ======================
// 优化版 MengCleaner
// ======================
window.MengCleaner = {
    cleanText(text, settings) {
        if (!text) return text;

        let cleaned = text;

        // ===== 文字提示 =====
        console.log("[梦晏晨] === 清洗开始 ===");
        console.log("[梦晏晨] 原文本:", text);

        // ===== 全局挂载辅助数组 =====
        window.MengYanChen = window.MengYanChen || {};
        const { pendingConfirmations, correctNames } = window.MengYanChen;

        //
        // 0️⃣ 上下文删除规则（仅处理 enabled）
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
                cleaned = cleaned.replace(fullRegex, '');
            } catch (err) {
                console.warn("[梦晏晨] 上下文规则错误:", rule.pattern, err);
            }
        }

        //
        // 1️⃣ 名字修正
        //
        for (const [from, to] of Object.entries(settings.nameFixMap || {})) {
            if (cleaned.includes(from)) {
                console.log(`[梦晏晨] 名字修正: "${from}" → "${to}"`);
            }
            cleaned = cleaned.replaceAll(from, to);
        }

        //
        // 2️⃣ regex规则（只处理 enabled）
        //
        for (const rule of settings.regexRules || []) {
            if (!rule.enabled) continue;
            try {
                if (!rule._regex) rule._regex = new RegExp(rule.pattern, rule.flags || "g");
                const matches = cleaned.match(rule._regex);
                if (matches?.length) console.log(`[梦晏晨] 正则规则匹配: "${rule.pattern}"`, matches);
                cleaned = cleaned.replace(rule._regex, rule.replace || "");
            } catch (err) {
                console.warn("[梦晏晨] regex规则错误:", rule.pattern, err);
            }
        }

        //
        // 3️⃣ 简单替换（只处理 enabled）
        //
        for (const rule of settings.simpleReplacements || []) {
            if (rule.enabled === false) continue;
            if (cleaned.includes(rule.from)) {
                console.log(`[梦晏晨] 简单替换: "${rule.from}" → "${rule.to}"`);
            }
            cleaned = cleaned.replaceAll(rule.from, rule.to);
        }

        //
        // 4️⃣ 句子清理
        //
        cleaned = cleaned
            .replace(/\n{3,}/g, "\n\n")     // 删除连续空行
            .replace(/[ \t]{2,}/g, " ")        // 删除多余空格
            .replace(/，\s*，/g, "，")     // 删除多余逗号
            .replace(/。\s*。/g, "。")    // 删除多余句号
            .replace(/：\s*：/g, "：")    // 删除多余冒号
            .replace(/的([，。])/g,"$1")   // 只在“的”前后重复或空格时才处理，正常无影响
            .replace(/\s*的\s*([，。])/g, "$1");

        //
        // 5️⃣ 删除奇葩字符
        //
        cleaned = cleaned.replace(
            /[^a-zA-Z0-9\u4e00-\u9fa5，。！？、；：“”‘’（）《》〈〉【】『』…\s]/g,
            ""
        );

        console.log("[梦晏晨] 清洗后文本:", cleaned);
        console.log("[梦晏晨] === 清洗结束 ===");

        return cleaned.trim();
    }
};
