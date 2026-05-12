(function () {

    // ======================
    // 上下文删句
    // ======================

    function cleanByContext(text, settings) {

        if (!settings.contextRules) {
            return text;
        }

        settings.contextRules.forEach(rule => {

            try {

                // 删除包含目标模式的整句话
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

        // 清理多余标点和空行
        text = text
            .replace(/，{2,}/g, "，")
            .replace(/。{2,}/g, "。")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        return text;
    }

    // ======================
    // 主清洗
    // ======================

    function cleanText(text, settings) {

        if (!text) return text;

        // 1. 名字修正
        Object.entries(settings.nameFixMap)
            .forEach(([wrong, correct]) => {

                text = text
                    .split(wrong)
                    .join(correct);

            });

        // 2. 上下文删句
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

    // ======================
    // 暴露 API
    // ======================

    window.MengCleaner = {
        cleanText,
        cleanByContext
    };

})();
