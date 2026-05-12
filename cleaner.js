function processMessage(msg, messageId){

    console.log(
        "[梦晏晨] processMessage触发",
        msg
    );

    if (!window.MengCleaner) return;

    if (!msg?.mes && !msg?.content) return;

    if (msg._meng_cleaned) return;

    const field = msg.mes ? "mes" : "content";

    const cleaned =
        window.MengCleaner.cleanText(
            msg[field],
            settings
        );

    if (cleaned !== msg[field]) {

        console.log(
            "[梦晏晨] 已检测到可清洗内容"
        );

        msg[field] = cleaned;

        const chat =
            window.SillyTavern
                ?.getContext?.()
                ?.chat;

        if (chat?.[messageId]) {

            chat[messageId][field] =
                cleaned;

            chat[messageId]._meng_cleaned =
                true;
        }

        const mesBlock =
            document.querySelector(
                `#chat .mes[mesid="${messageId}"] .mes_text`
            );

        if (mesBlock) {

            mesBlock.textContent =
                cleaned;

            console.log(
                "[梦晏晨] DOM已更新"
            );
        }
    }
}
