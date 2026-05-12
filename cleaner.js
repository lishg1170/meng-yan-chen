function cleanByContext(text, settings) {

    if (!settings.contextRules) {
        return text;
    }

    settings.contextRules.forEach(rule => {

        try {

            // 匹配整句
            const regex = new RegExp(
    `([^。！？；\\n]*${rule}(?:般|地|似地|一样)?[^。！？；\\n]*)`,
    "g"
            );

            text = text.replace(regex, "");

        } catch (e) {

            console.warn(
                "[梦晏晨] 上下文规则错误:",
                rule
            );

        }

    });

    // 清理多余空行
    text = text
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[，。]{2,}/g, "。");

    return text;
}

function cleanText(text, settings) {

    if (!text) return text;

    // 1. 名字修正
    Object.entries(settings.nameFixMap)
        .forEach(([wrong, correct]) => {

            text = text
                .split(wrong)
                .join(correct);

        });

    // 2. 上下文删句（必须在简单删词前）
    text = cleanByContext(text, settings);

    // 3. 简单脏词
    settings.banListSimple.forEach(word => {

        text = text
            .split(word)
            .join("");

    });

    // 4. 正则清洗
    settings.banListRegex.forEach(pattern => {

        try {

            text = text.replace(
                new RegExp(pattern, "g"),
                ""
            );

        } catch (e) {

            console.warn(
                "[梦晏晨] 正则错误:",
                pattern
            );

        }

    });

    return text;
}

window.MengCleaner = {
    cleanText,
    cleanByContext
};
