window.MengCleaner = {
    cleanText(text, settings) {
        if (!text) return text;

        let cleaned = text;

        //
        // 0. 上下文删除规则
        //
        const contextRules = settings.contextRules || [];
        for (const rule of contextRules) {
            try {
                // 构造整句删除正则（匹配从前一个标点到后一个标点的句子）
                const fullRegex = new RegExp(`([^。！？；\\n]*${rule.pattern}[^。！？；\\n]*)`, 'g');
                cleaned = cleaned.replace(fullRegex, '');
            } catch (err) {
                console.warn("[梦晏晨] 上下文删除规则错误", rule, err);
            }
        }

        //
        // 1. 名字修正
        //
        for (const [from, to] of Object.entries(settings.nameFixMap || {})) {
            cleaned = cleaned.replaceAll(from, to);
        }

        //
        // 2. regex规则
        //
        for (const rule of settings.regexRules || []) {
            try {
                const regex = new RegExp(rule.pattern, rule.flags || "g");
                cleaned = cleaned.replace(regex, rule.replace || "");
            } catch (err) {
                console.warn("[梦晏晨] regex规则错误", rule, err);
            }
        }

        //
        // 3. 简单替换
        //
        for (const rule of settings.simpleReplacements || []) {
            cleaned = cleaned.replaceAll(rule.from, rule.to);
        }

        //
        // 4. 句子清理
        //
        cleaned = cleaned.replace(/\n{3,}/g, "\n\n")  // 删除连续空行
                         .replace(/[ \t]{2,}/g, " ")  // 删除多余空格
                         .replace(/，\s*，/g, "，")
                         .replace(/。\s*。/g, "。")
                         .replace(/：\s*：/g, "：")
                         .replace(/的([，。])/g,"$1");  // 删除残缺“的”

        //
        // 5. 删除奇葩字符
        //
        cleaned = cleaned.replace(
            /[^a-zA-Z0-9\u4e00-\u9fa5，。！？、；：“”‘’（）《》〈〉【】『』…\s]/g,
            ""
        );

        return cleaned.trim();
    }
};