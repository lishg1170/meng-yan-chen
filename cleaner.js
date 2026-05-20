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

        // ===== 文字提示 =====
        console.log("[梦晏晨] === 清洗开始 ===");
        console.log("[梦晏晨] 原文本:", text);

        // ⚠️ 安全挂载辅助数组
        if(!window.MengYanChen) window.MengYanChen = {};
        if(!window.MengYanChen.pendingConfirmations) window.MengYanChen.pendingConfirmations = [];
        if(!window.MengYanChen.correctNames) window.MengYanChen.correctNames = new Set();
        const { pendingConfirmations, correctNames } = window.MengYanChen;

        //
        // 0️⃣ 上下文删除规则（仅处理 enabled）
        //
        const contextRules = settings.contextRules || [];
        for (const rule of contextRules) {
            if (!rule.enabled) continue;
            try {
                const fullRegex = new RegExp(`([^。！？；\\n]*${rule.pattern}[^。！？；\\n]*)`, 'g');
                const matches = cleaned.match(fullRegex);
                if (matches?.length) {
                    console.log(`[梦晏晨] 上下文删除匹配:`, matches);
                }
                cleaned = cleaned.replace(fullRegex, '');
            } catch (err) {
                console.warn("[梦晏晨] 上下文规则错误:", rule.pattern, err);
            }
        }

        //
        // 1️⃣ 名字修正
        //
        for (const rule of settings.nameFixRules || []) {

             if (rule.enabled === false) continue;

             const from = rule.from;
             const to = rule.to;

             if (!from || !to) continue;

             if (cleaned.includes(from)) {
                 console.log(`[梦晏晨] 名字修正: "${from}" → "${to}"`);
             }

             cleaned = cleaned.replaceAll(from, to);
        }

        //
        // 2️⃣ regex规则（只处理 enabled）
        //
        for (const rule of settings.regexRules || []) {
            if (!rule.enabled) continue;
            try {
                if (!rule._regex) rule._regex = new RegExp(rule.pattern, rule.flags || "g");
                const matches = cleaned.match(rule._regex);
                if (matches?.length) console.log(`[梦晏晨] 正则规则匹配: "${rule.pattern}"`, matches);
                cleaned = cleaned.replace(rule._regex, rule.replace || "");
            } catch (err) {
                console.warn("[梦晏晨] regex规则错误:", rule.pattern, err);
            }
        }

        //
        // 3️⃣ 简单替换（只处理 enabled）
        //
        for (const rule of settings.simpleReplacements || []) {
            if (rule.enabled === false) continue;
            if (cleaned.includes(rule.from)) {
                console.log(`[梦晏晨] 简单替换: "${rule.from}" → "${rule.to}"`);
            }
            cleaned = cleaned.replaceAll(rule.from, rule.to || "");
        }

        //
        // 4️⃣ 句子清理
        //
        cleaned = cleaned

        // ===== 基础清理 =====
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")

        // ===== 残句修复 =====

        // “眼睛里。”“空气里。”这种
        .replace(
            /(眼睛里|眼底里|眼中|眼眸中|空气中|空气里)[，。！？；]?/g,
            ""
        )

        // “盯着。”“看着。”这种单残句
        .replace(
            /^[^\n，。！？]{0,6}(盯着|看着|注视着|凝视着)[，。！？]?$/gm,
            ""
        )

        // “像。”“仿佛。”这种残缺连接词
        .replace(
            /^(像|仿佛|如同|宛若)[，。！？；]?$/gm,
            ""
        )

        // ===== 标点修复 =====

        // 同符号重复
        .replace(/，\s*，/g, "，")
        .replace(/。\s*。/g, "。")
        .replace(/：\s*：/g, "：")

        // 混合标点
        .replace(/，\s*。/g, "。")
        .replace(/。\s*，/g, "，")
        .replace(/,\s*\./g, ".")
        .replace(/\.\s*,/g, ",")

        // 连续标点压缩
        .replace(/[，,]{2,}/g, "，")
        .replace(/[。\.]{2,}/g, "。")
        .replace(/[！!]{2,}/g, "！")
        .replace(/[？?]{2,}/g, "？")

        // 句首标点
        .replace(/^[，。！？；：]+/gm, "")

        // 孤立标点
        .replace(/[，。！？；：]\s*[，。！？；：]+/g, "。")

        // ===== 动作残句 =====

        .replace(
            /^(他|她|它|自己|对方|空气|\{\{user\}\}|\{\{char\}\})[。！？]?$/gm,
            ""
        )

        // “盯着。”“看着。”这种超短动作句
        .replace(
            /^(\{\{user\}\}|\{\{char\}\})?\s*(盯着|看着|笑着|沉默着|站着)[。！？]?$/gm,
            ""
        )


        // ===== “的”修复 =====
        .replace(/(?<=\S)的([，。])/g, "$1")

        //
        // 5️⃣ 删除奇葩字符
        //
        cleaned = cleaned.replace(
            /[^a-zA-Z0-9\u4e00-\u9fa5，。！？、；：“”‘’（）《》〈〉【】『』…\s]/g,
            ""
        );

        console.log("[梦晏晨] 清洗后文本:", cleaned);
        console.log("[梦晏晨] === 清洗结束 ===");
        
        // ==== user和char变量恢复 ====
        for (const [k,v] of Object.entries(variableMap)) {
            cleaned = cleaned.replaceAll(v, k);
        }

        return cleaned.trim();
    }
};
export { MengCleaner };