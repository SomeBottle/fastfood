'use strict';

const { hashGlyph } = require('./glyphHasher.js');
const opentype = require('opentype.js');
const { readFileSync, writeFileSync } = require('fs');

// 载入字体
let ttfBuffer = readFileSync('./SourceHanSansSC-VF.ttf');
const font = opentype.parse(
    ttfBuffer.buffer.slice(ttfBuffer.byteOffset, ttfBuffer.byteOffset + ttfBuffer.byteLength)
);
const glyphs = font.glyphs.glyphs;

/**
 * 检查这个 Unicode 码点数组中是否有在基本中文汉字内的
 * @param {Number[]} unicodeArr 
 * @returns {Boolean}
 */
const isChineseChar = (unicodeArr) => {
    for (let u of unicodeArr) {
        if (u >= 0x4E00 && u <= 0x9FFF)
            return true;
    }
    return false;
}


(async () => {
    // 单独把字形对象提取出来序列化
    let uniToGlyphs = {};
    let glyphsToUni = {};
    let glyphsCnt = 0;
    for (let i in glyphs) {
        // 💡 为了减小输出体积，仅输出基本汉字 Unicode 对应的字形 0x4E00 - 0x9FFF
        /*
            💡 注意，一个字形可能对应多个 Unicode！！因此判断是否是汉字应当用 glyphs[i].unicodes 这个码点数组

            * 比如“一”就对应了 12032 和 19968 两个 Unicode 码点，

            * 如果忽略了这点，只用 glyphs[i].unicode 判断，就会漏掉一些汉字。
        */
        if (isChineseChar(glyphs[i].unicodes)) {
            // 存储字形的 SHA-1 值
            let [glyphHash, _] = await hashGlyph(glyphs[i].path.commands);
            uniToGlyphs[glyphs[i].unicode] = glyphHash;
            if (Object.hasOwn(glyphsToUni, glyphHash)) {
                // 字形哈希发生碰撞，一般不会有这种情况。
                console.log(`WARNING: The glyph of ${glyphs[i].unicode} collides with the glyph of ${glyphsToUni[glyphHash]}.`)
            }
            glyphsToUni[glyphHash] = glyphs[i].unicode;
            glyphsCnt++;
        }
    }
    console.log("Number of glyphs: " + glyphsCnt);
    writeFileSync('./original_uni_to_glyph.json', JSON.stringify(uniToGlyphs), {
        encoding: "utf-8"
    });
    writeFileSync('./original_glyph_to_uni.json', JSON.stringify(glyphsToUni), {
        encoding: "utf-8"
    });
})();
