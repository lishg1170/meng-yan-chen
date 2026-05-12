(function () {

    // ======================
    // 上下文整句删除
    // ======================

    function cleanByContext(text, settings) {

        if (!settings.contextBanList) {
            return text;
        }

        settings.contextBanList.forEach(rule => {

            try {

                const regex = new RegExp(
                    `[^。！？\\n]*${rule}[^。！？\\n]*[。！？]?`,
                    "g"
                );

                text = text.replace(regex, "");

            } catch (e) {

                console.warn(
                    "[梦晏晨] 上下文正则错误:",
                    rule
                );

            }

        });

        return text;
    }

    // ======================
    // 主清洗
    // ======================

    function cleanText(text, settings) {

        if (!text) return text;

        // 名字修正
        Object.entries(settings.nameFixMap)
            .forEach(([wrong, correct]) => {

                text = text
                    .split(wrong)
                    .join(correct);

            });

        // 简单脏词
        settings.banListSimple.forEach(word => {

            text = text
                .split(word)
                .join("");

        });

        // 普通正则
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

        // ⭐ 上下文整句删除
        text = cleanByContext(text, settings);

        // 清理多余空格换行
        text = text
            .replace(/\n{3,}/g, "\n\n")
            .replace(/([。！？])\1+/g, "$1")
            .trim();

        return text;
    }

    // ======================
    // 暴露 API
    // ======================

    window.MengCleaner = {
        cleanText
    };

})();
