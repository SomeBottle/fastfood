(async () => {
    const OPENTYPE_JS_URL = 'https://lf9-cdn-tos.bytecdntp.com/cdn/expire-1-M/opentype.js/1.3.4/opentype.min.js';
    const ORIGINAL_GLYPH_UNI_MAP_URL = 'https://gist.githubusercontent.com/SomeBottle/076bcea0fb2fd00163bd261143407b76/raw/035b77db2bfa6e9e51124940e7d1edf666462de0/original_glyph_to_uni.json';
    const styleElems = document.querySelectorAll('style');
    /**
     * 动态载入脚本
     * @param {String} url 
     * @returns Promise，载入完成时 resolve
     */
    const loadJs = (url) => {
        return new Promise((res) => {
            const jsElem = document.createElement('script');
            jsElem.type = 'text/javascript';
            jsElem.src = url;
            document.body.appendChild(jsElem);
            jsElem.onload = res;
        });
    };
    /**
     * 通过 opentype.js 载入字体
     * @param {String} url 
     * @returns Promise(opentype font)
     */
    const loadFont = async (url) => {
        return opentype.parse(
            await fetch(url)
                .then(res => res.arrayBuffer())
        );
    };
    /**
     * 计算某个字形的 path.commands 的 SHA-1 哈希值
     * @param {Object[]} pathCommands 
     * @returns {Promise<Array>} 返回数组 [SHA-1 Hash, commands 的字串表示]
     */
    const hashGlyph = async (pathCommands) => {
        // 为了保证相同的字形，哈希值可重现，需要把无序的 Object 有序处理后再进行哈希
        let strToBeHashed = '';
        for (let i = 0; i < pathCommands.length; i++) {
            let sortedCommand = Object.entries(pathCommands[i]).sort((a, b) => {
                if (a[0] != b[0]) {
                    // 先按键排
                    return a[0] - b[0];
                } else {
                    // 键相同就按值排
                    return a[1] - b[1];
                }
            });
            for (let kv of sortedCommand) {
                // 顺序拼接起来成为字串
                strToBeHashed += (kv[0].toString() + kv[1].toString());
            }
        }
        // 哈希后将字节转换为 16 进制表示，组成字串
        let hashed = Array.from(
            new Uint8Array(
                await crypto.subtle.digest('SHA-1',
                    new TextEncoder().encode(strToBeHashed)
                )
            )
        ).map(b => b.toString(16).padStart(2, '0')).join('');
        return [hashed, strToBeHashed];
    };
    // 和混淆字体相关的样式
    let fontStyle = '';
    for (let s of styleElems) {
        if (/font-family:\s*\"exam-data-decrypt-font\"/.test(s.innerHTML)) {
            // 先找到和 exam-data-decrypt-font 相关的 font-face 样式
            fontStyle = s.innerHTML;
            break;
        }
    }
    if (fontStyle.length === 0)
        return;
    // 被混淆字体的 URL
    let obfuscatedFontUrl = '';
    let matches = fontStyle.match(/url\("(.+?)"\)/);
    if (matches && matches.length > 1) {
        obfuscatedFontUrl = matches[1];
        console.log(`Obfucated font found: ${obfuscatedFontUrl}`);
    } else {
        return;
    }
    // 等待把 opentype.js 载入
    await loadJs(OPENTYPE_JS_URL);
    // 把被混淆的字体载入
    const obfuscatedFont = await loadFont(obfuscatedFontUrl);
    let obfuscatedGlyphs;
    try {
        obfuscatedGlyphs = obfuscatedFont.glyphs.glyphs;
    } catch (err) {
        console.log(`Failed to get glyphs: ${err}`);
        return;
    }
    // 把原字体所有字形的哈希值载入
    const originalGlyphToUni = await fetch(ORIGINAL_GLYPH_UNI_MAP_URL).then(res => res.json());
    // 混淆后的 Unicode 至原 Unicode 的映射
    const obfuscatedToOriginal = {};
    // 为被混淆字体的每个字体计算哈希，通过字形哈希映射，将混淆后的 Unicode 码点映射到原本的 Unicode 码点
    for (let i in obfuscatedGlyphs) {
        let { unicode, path } = obfuscatedGlyphs[i];
        if (unicode === undefined) // 跳过未知码点的
            continue;
        let [glyphHash, strToBeHashed] = await hashGlyph(path.commands);
        if (Object.hasOwn(originalGlyphToUni, glyphHash)) {
            obfuscatedToOriginal[unicode] = originalGlyphToUni[glyphHash];
        } else {
            console.log(`Unicode of ${glyphHash} not found. (Obfuscated as ${String.fromCodePoint(unicode)}(${unicode}) )`);
            console.log('Str to be hashed: ' + strToBeHashed);
        }
    }

    // 替换页面中汉字的 Unicode 码点
    // 比如所有混淆段落都有 class: xuetangx-com-encrypted-font
    const obfuscatedElems = document.querySelectorAll('.xuetangx-com-encrypted-font');
    for (let elem of obfuscatedElems) {
        let resultHtml = '';
        for (let chr of elem.innerHTML) {
            if (/[\u4e00-\u9fff]/g.test(chr)) {
                // 暂且仅处理汉字字符
                let uni_t = chr.codePointAt(0);
                if (Object.hasOwn(obfuscatedToOriginal, uni_t)) {
                    let realChr = String.fromCodePoint(obfuscatedToOriginal[uni_t]);
                    resultHtml += realChr;
                    console.log(`Mapped ${chr}(${uni_t}) to ${realChr}(${realChr.codePointAt(0)}).`);
                } else {
                    resultHtml += `<b>${chr}</b>`;
                }
            } else {
                resultHtml += chr;
            }
        }
        elem.innerHTML = resultHtml;
        // 取消掉 class
        elem.classList.remove('xuetangx-com-encrypted-font');
    }
})();