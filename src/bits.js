/**
 * @copyright: Copyright (c) 2021-2023
 * @author: Paul Higgs
 * @file: decode.js
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

import { BREAK } from './markup.js';

export class BitList {
  constructor() {
    this.bytes = [];
  }

  push(b) {
    this.bytes.push(b & 0xff);
  }

  bitset(bitNo) {
    if (bitNo <= 0 || bitNo > this.bytes.length * 8) return false;
    const idx = this.bytes.length - Math.floor((bitNo - 1) / 8) - 1;
    let bit = bitNo % 8;
    if (bit == 0) bit = 8;

    return this.bytes[idx] & (1 << (bit - 1)) ? true : false;
  }

  bitsetB(bitNo) {
    if (bitNo < 0 || bitNo > this.bytes.length * 8 - 1) return false;
    const idx = Math.floor(bitNo / 8);
    const bit = 1 << (7 - (bitNo % 8));

    return this.bytes[idx] & bit ? true : false;
  }

  valueB(bitNo, length) {
    let tot = 0;
    for (let i = 0; i < length; i++) {
      tot = tot << 1;
      tot += this.bitsetB(bitNo + i) ? 1 : 0;
    }
    return tot;
  }

  pointers(bitNo) {
    const idx = this.bytes.length - Math.floor((bitNo - 1) / 8) - 1;
    let bit = bitNo % 8;
    if (bit == 0) bit = 8;
    return `<i>${bitNo}=${idx}:${bit}</i>${BREAK}`;
  }

  toString() {
    let i = 0,
      res = "";
    while (i < this.bytes.length) {
      const comp = this.bytes[i++].toString(16);
      res += (comp.length == 1 ? "0" : "") + comp;
    }
    return res;
  }
}

export function bitSet32(val, bit) {
  // bit  3         2         1
  //     10987654321098765432109876543210
  if (bit < 0 || bit > 31) return false;
  return val & Math.pow(2, bit);
}

