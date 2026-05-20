// ======================
// 优化版 MengCleaner
// ======================
const MengCleaner = {
    async cleanText(text, settings) {
        if (!text) return text;

        let cleaned = text;

        // ==== user和char变量保护 ====
        const variableMap = {
            "{{user}}": "MENGUSERTOKEN",
            "{{char}}": "MENGCHARTOKEN"
        };

        for (const [k,v] of Object.entries(variableMap)) {
            cleaned = cleaned.replaceAll(k, v);
        }

        // ===== 保护状态栏/XML/标签 =====
        const protectedBlocks = [];
        cleaned = cleaned.replace(
            /<([a-zA-Z\u4e00-\u9fa5][^>\s]*)[^>]*>[\s\S]*?<\/\1>|\[[^\]]*\]/g,
            (m) => {
                protectedBlocks.push(m);
                return `MENGBLOCK${protectedBlocks.length - 1}`;
            }
        );

        console.log("[梦晏晨] === 清洗开始 ===");
        console.log("[梦晏晨] 原文本:", text);

        // ⚠️ 安全挂载辅助数组
        if(!window.MengYanChen) window.MengYanChen = {};
        if(!window.MengYanChen.pendingConfirmations) window.MengYanChen.pendingConfirmations = [];
        if(!window.MengYanChen.correctNames) window.MengYanChen.correctNames = new Set();
        const { pendingConfirmations, correctNames } = window.MengYanChen;

        // ===== 0️⃣ 上下文删除规则 =====
        const contextRules = settings.contextRules || [];
        for (const rule of contextRules) {
            if (!rule.enabled) continue;
            try {
                const fullRegex = new RegExp(`([^。！？；\\n]*${rule.pattern}[^。！？；\\n]*)`, 'g');
                const matches = cleaned.match(fullRegex);
                if (matches?.length) console.log(`[梦晏晨] 上下文删除匹配:`, matches);
                cleaned = cleaned.replace(fullRegex, ' ');
            } catch (err) {
                console.warn("[梦晏晨] 上下文规则错误:", rule.pattern, err);
            }
        }

        // ===== 1️⃣ 名字修正 =====
        for (const rule of settings.nameFixRules || []) {
             if (rule.enabled === false) continue;
             const {from, to} = rule;
             if (!from || !to) continue;
             if (cleaned.includes(from)) {
                 console.log(`[梦晏晨] 名字修正: "${from}" → "${to}"`);
             }
             cleaned = cleaned.replaceAll(from, to);
        }

        // ===== 2️⃣ regex规则 =====
        for (const rule of settings.regexRules || []) {
            if (!rule.enabled) continue;
            try {
                if (!rule._regex) rule._regex = new RegExp(rule.pattern, rule.flags || "g");
                const matches = cleaned.match(rule._regex);
                if (matches?.length) console.log(`[梦晏晨] 正则规则匹配: "${rule.pattern}"`, matches);
                cleaned = cleaned.replace(rule._regex, rule.replace ?? " ");
            } catch (err) {
                console.warn("[梦晏晨] regex规则错误:", rule.pattern, err);
            }
        }

        // ===== 3️⃣ 简单替换 =====
        for (const rule of settings.simpleReplacements || []) {
            if (rule.enabled === false) continue;
            if (cleaned.includes(rule.from)) {
                console.log(`[梦晏晨] 简单替换: "${rule.from}" → "${rule.to}"`);
            }
            cleaned = cleaned.replaceAll(rule.from, rule.to || "");
        }

        // ===== 4️⃣ 句子清理与自然段优化 =====
        cleaned = cleaned
            // 删除短动作句（单独一句或单独一行）
            .replace(/^(?:\{\{user\}\}|\{\{char\}\})?\s*(盯着|看着|笑着|沉默着|站着)[。！？,]*\s*$/gm, "")
            
            // 删除残缺连接词
            .replace(/^(像|仿佛|如同|宛若)[，。！？；,]*$/gm, "")

            // 弱处理眼睛/空气残句
            .replace(/(眼睛里|眼底里|眼中|眼眸中|空气中|空气里)/g, " ")

            // ===== 标点压缩 =====
            .replace(/，\s*，/g, "，")
            .replace(/。\s*。/g, "。")
            .replace(/：\s*：/g, "：")
            .replace(/，\s*。/g, "。")
            .replace(/。\s*，/g, "，")
            .replace(/,\s*\./g, ".")
            .replace(/\.\s*,/g, ",")
            .replace(/[，,]{2,}/g, "，")
            .replace(/[。\.]{2,}/g, "。")
            .replace(/[！!]{2,}/g, "！")
            .replace(/[？?]{2,}/g, "？")
            .replace(/^[，。！？；：]+/gm, "")
            .replace(/[，。！？；：]\s*[，。！？；：]+/g, "。")

            // 删除孤立代词/动作残句
            .replace(/^(他|她|它|自己|对方|空气|\{\{user\}\}|\{\{char\}\})[。！？,]*$/gm, "")

            // ===== 多空行压缩为 1 空行，保留自然段 =====
            .replace(/\n{3,}/g, "\n\n")
            // 中文正文不增加空格，压缩多空格为 1
            .replace(/[ \t]{2,}/g, " ");

        // ===== 分割自然段（2~4句随机为一个自然段） =====
        const sentences = cleaned.split(/(?<=[。！？])/g).map(s => s.trim()).filter(s => s.length > 0);
        let paragraph = [];
        let paragraphs = [];
        for (let i = 0; i < sentences.length; i++) {
            paragraph.push(sentences[i]);
    
           // 随机生成本段句数 2~4
           const randLength = 2 + Math.floor(Math.random() * 3); // 2,3,4
    
           // 当前段达到随机长度或者到达最后一句就换段
           if (paragraph.length >= randLength || i === sentences.length - 1) {
               paragraphs.push(paragraph.join(""));
               paragraph = [];
           }
        }
        cleaned = paragraphs.join("\n\n");

        // ===== 5️⃣ 删除奇葩字符 =====
        cleaned = cleaned.replace(
            /[^a-zA-Z0-9\u4e00-\u9fa5，。！？、；：“”‘’（）《》〈〉【】『』…@\u{1F300}-\u{1FAFF}\s]/gu,
            ""
        );

        // ==== 状态栏/标签恢复 ====
        cleaned = cleaned.replace(/MENGBLOCK(\d+)/g, (_, i) => protectedBlocks[i]);

        // ==== user和char变量恢复 ====
        for (const [k,v] of Object.entries(variableMap)) {
            cleaned = cleaned.replaceAll(v, k);
        }

        console.log("[梦晏晨] 清洗后文本:", cleaned);
        console.log("[梦晏晨] === 清洗结束 ===");

        return cleaned.trim();
    }
};

export { MengCleaner };