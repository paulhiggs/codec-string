/**
 * @copyright: Copyright (c) 2021-2023
 * @author: Paul Higgs
 * @file: decode-avc.js
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

/*jshint esversion: 6 */
/**
 * https://blog.pearce.org.nz/2013/11/what-does-h264avc1-codecs-parameters.html
 * https://en.wikipedia.org/wiki/Advanced_Video_Coding
 **/

import { BREAK, err } from './markup';
import { hexDigits } from './hexDigits';
import { sscanf } from './sscanf-func';

export function decodeAVC(val) {
  // regex from DVB TM-STREAM0087:  /avc[1-4]\.[a-fA-F\d]{6}/

  function AVCconstraint(val, constraint) {
    // constraint 012345--
    // bit        76543210
    if (constraint < 0 || constraint > 5) return false;
    return val & Math.pow(2, 7 - constraint) ? true : false;
  }

  const parts = val.split(".");
  let res = "";

  if (parts.length != 2) return err("invalid format") + BREAK;

  if (parts[1].length != 6)
    return (
      err(`invalid parameters length (${parts[1].length}) - should be 6`) +
      BREAK
    );

  if (!hexDigits(parts[1]))
    return err("parameters contains non-hex digits") + BREAK;

  const prof = sscanf(parts[1], "%2x%2x%2x");
  res += `profile_idc=${prof[0]} constraint_set=${prof[1]} level_idc=${prof[2]}${BREAK}`;

  res += "profile=";
  switch (prof[0]) {
  case 0x2c:
    res += "CAVLC 4:4:4";
    break;
  case 0x42:
    res += `${AVCconstraint(prof[1], 1) ? "Constrained " : ""}Baseline`;
    break;
  case 0x4d:
    res += `${AVCconstraint(prof[1], 1) ? "Constrained " : ""}Main`;
    break;
  case 0x53:
    res += `Scalable ${AVCconstraint(prof[1], 5) ? "Constrained " : ""}Base`;
    break;
  case 0x56:
    res += "Scalable ";
    if (!AVCconstraint(prof[1], 3) && AVCconstraint(prof[1], 5))
      res += "Constrained ";
    if (AVCconstraint(prof[1], 3) && !AVCconstraint(prof[1], 5))
      res += "Intra ";
    res += "High";
    break;
  case 0x58:
    res += "Extended";
    break;
  case 0x63:
    res += `High 10${AVCconstraint(prof[1], 3) ? " Intra" : ""}`;
    break;
  case 0x64:
    if (AVCconstraint(prof[1], 4) && !AVCconstraint(prof[1], 5))
      res += "Progressive ";
    if (!AVCconstraint(prof[1], 4) && AVCconstraint(prof[1], 5))
      res += "Constrained ";
    res += "High";
    break;
  case 0x76:
    res += "Multiview High";
    break;
  case 0x7a:
    res += `High 4:2:2${AVCconstraint(prof[1], 3) ? " Intra" : ""}`;
    break;
  case 0x80:
    res += "Stereo High";
    break;
  case 0x86:
    res += "MFC High";
    break;
  case 0x87:
    res += "MFC Depth High";
    break;
  case 0x8a:
    res += "Multiview Depth High High";
    break;
  case 0x8b:
    res += "Enhanced Multiview Depth High High";
    break;
  case 0xf4:
    res += `High 4:4:4${
      AVCconstraint(prof[1], 3) ? " Intra" : " Predictive"
    }`;
    break;
  default:
    res += err("unknown");
  }
  res += ` (${prof[0].toString(16)})${BREAK}`;

  res += "constraints=";
  for (let i = 0; i <= 5; i++) res += AVCconstraint(prof[1], i) ? i : "-";
  res += BREAK;

  res += "level=";
  switch (prof[2]) {
  case 0x0a:
    res += "1";
    break;
  case 0x0b:
    res += AVCconstraint(prof[1], 3) ? "1b" : "1.1";
    break;
  case 0x0c:
    res += "1.2";
    break;
  case 0x1d:
    res += "1.3";
    break;
  case 0x14:
    res += "2";
    break;
  case 0x15:
    res += "2.1";
    break;
  case 0x16:
    res += "2.2";
    break;
  case 0x1e:
    res += "3";
    break;
  case 0x1f:
    res += "3.1";
    break;
  case 0x20:
    res += "3.2";
    break;
  case 0x28:
    res += "4";
    break;
  case 0x29:
    res += "4.1";
    break;
  case 0x2a:
    res += "4.2";
    break;
  case 0x32:
    res += "5";
    break;
  case 0x33:
    res += "5.1";
    break;
  case 0x34:
    res += "5.2";
    break;
  case 0x3c:
    res += "6";
    break;
  case 0x3d:
    res += "6.1";
    break;
  case 0x3f:
    res += "6.2";
    break;
  default:
    res += err("undefined");
  }
  res += ` (${prof[2].toString(16)})${BREAK}`;

  return res;
}

export function registerAVC(addHandler) {
  addHandler(["avc1", "avc2", "avc3", "avc4"], "AVC/H.264", decodeAVC);
  addHandler(["mvc1", "mvc2"], "Multiview Coding", decodeAVC);
  addHandler("svc1", "Scalable Video Coding", decodeAVC);
}
