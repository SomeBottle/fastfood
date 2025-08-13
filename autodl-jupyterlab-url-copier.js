// ==UserScript==
// @name         AutoDL JupyterLab URL Copier
// @namespace    https://github.com/SomeBottle/fastfood
// @version      2025-08-13
// @description  在 AutoDL 控制台实例列表显示 JupyterLab URL 复制按钮
// @author       SomeBottle
// @match        https://www.autodl.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=autodl.com
// @license      MIT
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    // 本脚本的前缀
    const SCRIPT_PREFIX = '[JupyterLab URL Copier]';
    // AutoDL 的请求基于 XMLHttpRequest, 拦截改写
    const INSTANCE_API_URL_PATTERN = /\/api\/.*?\/instance$/i;
    // 复制按钮的样式
    const COPY_BTN_STYLE_SHEET = `
        .jupyter-url-copy-btn{
            position: relative;
            display: block;
            color: #46a0ffff;
            text-decoration: none;
            transition: .5s ease;
        }
        .jupyter-url-copy-btn:hover{
            color: #1cced7ff;
        }
        .jupyter-url-copy-btn::after{
            position: absolute;
            z-index: 900;
            content: "(๑‾ ꇴ ‾๑) 已复制";
            left: 0;
            top: 50%;
            width: 100%;
            text-align: left;
            pointer-events: none;
            transform: translateY(-50%);
            transition: .5s ease;
            opacity: 0;
            background-color: #ffffffbf;
        }
        .copied-notice::after{
            opacity: 1;
        }
    `;
    // 存储实例 UUID 到 JupyterLab URL 的映射
    const instanceId2Url = {};
    // 存储实例 UUID 到 DOM 节点的映射
    const instanceId2Node = {};
    // 存储上一次拦截结果中出现的 URL
    let prevInstanceUrls = [];
    // 哨兵 DOM 元素，用于检测页面中是否有按钮存在
    let sentryNode = null;
    // 比较数组是否完全一致
    const arraysEqual = function (a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    };
    // 找到页面中 instanceId 出现的元素
    const searchNodes = function (node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            let nodeText = node.innerText;
            if (nodeText) {
                nodeText = nodeText.trim();
                if (nodeText in instanceId2Url) {
                    instanceId2Node[nodeText] = node;
                }
            }
        }
        node.childNodes.forEach(child => searchNodes(child));
    };
    // 拦截 XMLHttpRequest 请求响应
    const requestHook = function () {
        const response = JSON.parse(this.responseText);
        if (response.data) {
            const instanceList = response.data.list;
            let currentInstanceUrls = [];
            for (let instance of instanceList) {
                const url = `https://${instance.jupyter_domain}/jupyter/?token=${instance.jupyter_token}`;
                currentInstanceUrls.push(url);
                instanceId2Url[instance.uuid] = url;
            }
            if (sentryNode !== null && document.contains(sentryNode) && arraysEqual(currentInstanceUrls, prevInstanceUrls)) {
                // 如果当前实例与上一次相同，则不需要更新，减少资源浪费
                console.log(`${SCRIPT_PREFIX} No changes in instance URLs.`);
                return;
            }
            prevInstanceUrls = currentInstanceUrls;
            // 搜索 DOM 中相应的结点
            searchNodes(document.body);
            for (let insId in instanceId2Url) {
                let insNode = instanceId2Node[insId];
                let copyBtnId = `jupyter-url-copy-btn-${insId}`;
                // 防止元素重复添加
                if (insNode && document.getElementById(copyBtnId) === null) {
                    // 在这个结点的后面添加一个复制 URL 的按钮
                    let copyBtn = document.createElement('a');
                    copyBtn.innerText = '复制 JupyterLab URL';
                    copyBtn.href = 'javascript:void(0)';
                    copyBtn.onclick = function () {
                        navigator.clipboard.writeText(instanceId2Url[insId]);
                        // 复制后的提示
                        this.classList.add('copied-notice');
                        setTimeout(() => {
                            this.classList.remove('copied-notice');
                        }, 1200);
                    };
                    copyBtn.classList.add('jupyter-url-copy-btn');
                    copyBtn.id = copyBtnId;
                    sentryNode = copyBtn;
                    insNode.parentNode.insertAdjacentElement('afterend', copyBtn);
                    console.log(`${SCRIPT_PREFIX} Added copy button of the instance: ${insId}`);
                }
            }
        }
        this.removeEventListener('load', requestHook);
    };
    const originalOpen = XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function (method, url, ...args) {
        if (INSTANCE_API_URL_PATTERN.test(url)) {
            // 如果是指定 URL 则开始监听
            this.addEventListener('load', requestHook.bind(this));
        }
        return originalOpen.apply(this, [method, url, ...args]);
    };
    // 把按钮样式加入 DOM
    const btnStyle = document.createElement('style');
    btnStyle.innerHTML = COPY_BTN_STYLE_SHEET;
    document.head.appendChild(btnStyle);
    console.log(`${SCRIPT_PREFIX} JupyterLab URL Copier Loaded, have fun~ /ᐠ｡ꞈ｡ᐟ\\`);
})();
