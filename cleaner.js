window.MengCleaner = {
    cleanText(text, settings) {
        if (!text) return text;

        let cleaned = text;

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
        // 删除连续空行
        cleaned = cleaned.replace(/\n{3,}/g, "\n\n")
            // 删除多余空格
            .replace(/[ \t]{2,}/g, " ")
            // 修复中文标点
            .replace(/，\s*，/g, "，")
            .replace(/。\s*。/g, "。")
            .replace(/：\s*：/g, "：")
            // 删除残缺“的”
            .replace(/的([，。])/g, "$1");

        //
        // 5. 删除奇葩字符（保留中文、英文、数字、标点、特殊符号『』…）
        //
        cleaned = cleaned.replace(
            /[^a-zA-Z0-9\u4e00-\u9fa5，。！？、；：“”‘’（）《》〈〉【】『』…\s]/g,
            ""
        );

        return cleaned.trim();
    }
};