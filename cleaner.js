function cleanText(text, settings) {

    console.log(
    "[梦晏晨] cleanText执行:",
    text
    );

    if (!text) return text;

    // ======================
    // 1. 上下文整句删除（最先）
    // ======================

    text = cleanByContext(text, settings);

    // ======================
    // 2. 普通正则
    // ======================

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

    // ======================
    // 3. 简单脏词
    // ======================

    settings.banListSimple.forEach(word => {

        text = text
            .split(word)
            .join("");

    });

    // ======================
    // 4. 名字修正
    // ======================

    Object.entries(settings.nameFixMap)
        .forEach(([wrong, correct]) => {

            text = text
                .split(wrong)
                .join(correct);

        });

    // ======================
    // 5. 清理残留
    // ======================

    text = text
        .replace(/\n{3,}/g, "\n\n")
        .replace(/([。！？])\1+/g, "$1")
        .replace(/，{2,}/g, "，")
        .trim();

    return text;
}
