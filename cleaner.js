function cleanByContext(text, settings) {

    if (!settings.contextRules) {
        return text;
    }

    settings.contextRules.forEach(rule => {

        try {

            // 匹配：
            // 从最近的句子起点
            // 一直到句尾

            const regex = new RegExp(
                `[^。！？\\n]*${rule}[^。！？\\n]*[。！？]?`,
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

    // 清理残留标点
    text = text
        .replace(/,{2,}/g, ",")
        .replace(/，{2,}/g, "，")
        .replace(/。{2,}/g, "。")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/^\s+|\s+$/g, "");

    return text;
}

window.MengCleaner = {
    cleanText,
    cleanByContext
};
