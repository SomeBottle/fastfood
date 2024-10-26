'use strict';

const opentype = require('opentype.js');
const { readFileSync } = require('fs');

// 载入字体
let examFontBuffer = readFileSync('./exam_font_4bdf2fbaceee4b098e767a8149a1b21b.ttf');
const examFont = opentype.parse(
    // Buffer 转换为 ArrayBuffer
    examFontBuffer.buffer.slice(examFontBuffer.byteOffset, examFontBuffer.byteOffset + examFontBuffer.byteLength)
);

let originalFontBuffer = readFileSync('./SourceHanSansSC-VF.ttf');
const originalFont = opentype.parse(
    originalFontBuffer.buffer.slice(originalFontBuffer.byteOffset, originalFontBuffer.byteOffset + originalFontBuffer.byteLength)
);

let examCommands = examFont.charToGlyph(String.fromCodePoint(0x6237)).path.commands;
let originalCommands = originalFont.charToGlyph(String.fromCodePoint(0x9488)).path.commands;

console.log(JSON.stringify(examCommands) === JSON.stringify(originalCommands))