'use strict';

const { hashGlyph } = require('./glyphHasher.js');
const opentype = require('opentype.js');
const { readFileSync } = require('fs');


// 载入字体
let ttfBuffer = readFileSync('./SourceHanSansSC-VF.ttf');
const font = opentype.parse(
    ttfBuffer.buffer.slice(ttfBuffer.byteOffset, ttfBuffer.byteOffset + ttfBuffer.byteLength)
);

const targetGlyph = font.charToGlyph('一');
console.log(targetGlyph);
console.log(targetGlyph.path);

// 可以发现一个字形可能对应多个 Unicode
(async () => {
    let [glyphHash, strToBeHashed] = await hashGlyph(targetGlyph.path.commands);
    console.log(`Hash: ${glyphHash}\nStrToBeHashed: ${strToBeHashed}`);
})();