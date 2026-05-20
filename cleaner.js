// ======================
// 完整优化版 MengCleaner
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

    // ==== 状态栏 / XML / 标签保护 ====
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

    // ==== 0️⃣ 上下文删除规则（可选） ====
    const contextRules = settings.contextRules || [];
    for (const rule of contextRules) {
      if (!rule.enabled) continue;
      try {
        const fullRegex = new RegExp(`([^。！？；\\n]*${rule.pattern}[^。！？；\\n]*)`, 'g');
        const matches = cleaned.match(fullRegex);
        if (matches?.length) console.log("[梦晏晨] 上下文删除匹配:", matches);
        cleaned = cleaned.replace(fullRegex, ' ');
      } catch (err) {
        console.warn("[梦晏晨] 上下文规则错误:", rule.pattern, err);
      }
    }

    // ==== 1️⃣ 名字修正 ====
    for (const rule of settings.nameFixRules || []) {
      if (rule.enabled === false) continue;
      const from = rule.from, to = rule.to;
      if (!from || !to) continue;
      if (cleaned.includes(from)) console.log(`[梦晏晨] 名字修正: "${from}" → "${to}"`);
      cleaned = cleaned.replaceAll(from, to);
    }

    // ==== 2️⃣ regex规则 ====
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

    // ==== 3️⃣ 简单替换 ====
    for (const rule of settings.simpleReplacements || []) {
      if (rule.enabled === false) continue;
      if (cleaned.includes(rule.from)) console.log(`[梦晏晨] 简单替换: "${rule.from}" → "${rule.to}"`);
      cleaned = cleaned.replaceAll(rule.from, rule.to || "");
    }

    // ==== 4️⃣ 基础清理 & 标点优化 ====
    cleaned = cleaned
      // 多空行压缩为 2 行
      .replace(/\n{3,}/g, "\n\n")
      // 删除中文正文多余空格（状态栏除外）
      .replace(/[ \t]+/g, "")
      // 残句弱修复
      .replace(/(眼睛里|眼底里|眼中|眼眸中|空气中|空气里)/g, " ")
      // 多余标点优化
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
      .replace(/[，。！？；：]\s*[，。！？；：]+/g, "。");

    // ==== 5️⃣ 动作残句清理（短动作句贪婪匹配） ====
    cleaned = cleaned.replace(
      /((?:\{\{user\}\}|\{\{char\}\})?\s*(?:盯着|看着|笑着|沉默着|站着)[。！？]*)+/g,
      ""
    );

    // ==== 6️⃣ “的”残句修复 ====
    cleaned = cleaned.replace(/(?<=\S)的([，。])/g, "$1");

    // ==== 7️⃣ 拆分句子 & 合并自然段（2~4句为一段） ====
    let sentences = cleaned.split(/([。！？])/g).reduce((acc, cur, i, arr) => {
      if (/[。！？]/.test(cur)) {
        acc[acc.length-1] += cur; // 句号加回上一句
      } else {
        acc.push(cur);
      }
      return acc;
    }, []);

    let paragraphs = [];
    for (let i = 0; i < sentences.length; ) {
      let n = Math.min(2 + Math.floor(Math.random()*3), sentences.length-i); // 2~4句
      let para = sentences.slice(i, i+n).join("");
      paragraphs.push(para);
      i += n;
    }
    cleaned = paragraphs.join("\n\n"); // 段落之间空一行

    // ==== 8️⃣ 删除奇葩字符（保留中文、英文、标点、表情等） ====
    cleaned = cleaned.replace(
      /[^a-zA-Z0-9\u4e00-\u9fa5，。！？、；：“”‘’（）《》〈〉【】『』…@\u{1F300}-\u{1FAFF}\s]/gu,
      ""
    );

    // ==== 9️⃣ 状态栏/标签恢复 ====
    cleaned = cleaned.replace(/MENGBLOCK(\d+)/g, (_, i) => protectedBlocks[i]);

    // ==== 10️⃣ user和char变量恢复 ====
    for (const [k,v] of Object.entries(variableMap)) {
      cleaned = cleaned.replaceAll(v, k);
    }

    console.log("[梦晏晨] 清洗后文本:", cleaned);
    console.log("[梦晏晨] === 清洗结束 ===");

    return cleaned.trim();
  }
};

export { MengCleaner };