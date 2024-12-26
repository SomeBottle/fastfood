// ==UserScript==
// @name         重新包装剪贴板中的公式
// @namespace    https://github.com/SomeBottle/fastfood
// @version      2024-12-26
// @description  在复制的时候替换文本中的 \[ 和 \] 为 $$, \( 和 \) 为 $, 以便在 markdown 中显示为公式
// @author       SomeBottle
// @match        https://chat.deepseek.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=deepseek.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    // Hook 掉剪贴板的写入函数
    const originalWrite = window.navigator.clipboard.writeText;
    window.navigator.clipboard.writeText = (text) => {
        // 匹配成对的括号进行替换
        text = text.replace(/\\\[([\s\S]+?)\\\]/g, (match, p1) => `$$\n${p1.trim()}\n$$`);
        text = text.replace(/\\\(([\s\S]+?)\\\)/g, (match, p1) => `$${p1.trim()}$`);
        console.log('Rewrapped formulas in text.');
        // 调用原始的写入函数
        return originalWrite.call(window.navigator.clipboard, text);
    };
})();