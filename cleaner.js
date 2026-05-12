function cleanText(text, settings) {

    if (!text) return text;

    Object.entries(settings.nameFixMap)
        .forEach(([wrong, correct]) => {

            text = text
                .split(wrong)
                .join(correct);

        });

    settings.banListSimple.forEach(word => {

        text = text
            .split(word)
            .join("");

    });

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
    cleanText
};
