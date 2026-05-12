window.MengCleaner = {

    cleanText(text, settings) {

        if (!text) return text;

        let result = text;

        // 名字替换
        for (const [from, to] of Object.entries(settings.nameFixMap || {})) {

            result = result.replaceAll(from, to);
        }

        // 简单违禁词
        for (const word of settings.banListSimple || []) {

            result = result.replaceAll(word, "");
        }

        // 正则违禁
        for (const rule of settings.banListRegex || []) {

            result =
                result.replace(
                    new RegExp(rule, "g"),
                    ""
                );
        }

        return result;
    }
};
