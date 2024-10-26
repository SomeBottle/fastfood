'use strict';

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
    let hash = Array.from(
        new Uint8Array(
            await crypto.subtle.digest('SHA-1',
                new TextEncoder().encode(strToBeHashed)
            )
        )
    ).map(b => b.toString(16).padStart(2, '0')).join('');
    return [hash, strToBeHashed];
};

module.exports = {
    hashGlyph
}