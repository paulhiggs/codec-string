/**
 * @copyright: Copyright (c) 2021-2023
 * @author: Paul Higgs
 * @file: decode-text.js
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

import { err, warn } from './markup.js';

export function decodeSTPP(val) {
  const parts = val.split(".");

  let res = "";
  if (parts.length > 1) {
    if (parts[1].toLowerCase() == "ttml") {
      // https://www.w3.org/TR/ttml-profile-registry/
      if (parts.length > 2) {
        switch (parts[2].toLowerCase()) {
        case "cfi1":
          // Common File Format & Media Formats Specification version 2.2. DECE. 31 July 2015.
          // URL: https://uvcentral.com/files/CFFMediaFormat-2_2.pdf clause 6.4.3.5
          res += "DECE Image Subtitle Profile";
          break;
        case "cft1":
          // Common File Format & Media Formats Specification version 2.2. DECE. 31 July 2015.
          // URL: https://uvcentral.com/files/CFFMediaFormat-2_2.pdf clause 6.4.3.4
          res += "DECE Test Subtitle Profle";
          break;
        case "ede1":
          // IRT Technical Guidelines: urn:IRT:ebu-tt-basic-de:2013-07
          res += "IRT";
          break;
        case "etd1":
          // EBU TECH 3380: "EBU-TT-D Subtitling Distribution Format", Version 1. European Broadcasting Union. March 2015.
          // URL: https://tech.ebu.ch/docs/tech/tech3380v1_0.pdf
          res += "EBU-TT Distribution V1.0";
          break;
        case "etd2":
          // EBU TECH 3380: "EBU-TT-D Subtitling Distribution Format", Version 1.0.1. European Broadcasting Union. May 2018.
          // URL: https: //tech.ebu.ch/docs/tech/tech3380v1_0_1.pdf
          res += "EBU-TT Distribution V1.0.1";
          break;
        case "etl1":
          // EBU TECH 3370: "EBU-TT, Part 3 Live Subtitling Applications", Version 1.0. European Broadcasting Union. May 2017.
          // URL: https://tech.ebu.ch/docs/tech/tech3370v1_0.pdf
          res += "EBU-TT Live";
          break;
        case "etx1":
          // EBU TECH 3350: "EBU-TT Subtitling format definition", Version 1.0. European Broadcasting Union. July 2012.
          // URL: https://tech.ebu.ch/docs/tech/tech3350v1-0.pdf
          res += "EBU Subtitling Format v1.0";
          break;
        case "etx2":
          // EBU TECH 3350: "EBU-TT Subtitling format definition", Version 1.1. European Broadcasting Union. September 2015.
          // URL: https://tech.ebu.ch/docs/tech/tech3350v1_1.pdf
          res += "EBU Subtitling Format v1.1";
          break;
        case "etx3":
          // EBU TECH 3350: "EBU-TT Subtitling format definition", Version 1.2. European Broadcasting Union. May 2017.
          // URL: https://tech.ebu.ch/docs/tech/tech3350v1_2.pdf
          res += "EBU Subtitling Format v1.2";
          break;
        case "im1i":
          // TTML Profiles for Internet Media Subtitles and Captions 1.0.1 (IMSC1). Pierre-Anthony Lemieux. W3C. 24 April 2018. W3C Recommendation.
          // URL: https://www.w3.org/TR/2018/REC-ttml-imsc1.0.1-20180424/
          res += "ISMC1 image";
          break;
        case "im1t":
          // TTML Profiles for Internet Media Subtitles and Captions 1.0.1 (IMSC1). Pierre-Anthony Lemieux. W3C. 24 April 2018. W3C Recommendation.
          // URL: https://www.w3.org/TR/2018/REC-ttml-imsc1.0.1-20180424/
          res += "ISMC1 text";
          break;
        case "im2i":
          // TTML Profiles for Internet Media Subtitles and Captions 1.1. Pierre-Anthony Lemieux. W3C. 8 November 2018. W3C Recommendation.
          // URL: https://www.w3.org/TR/2018/REC-ttml-imsc1.1-20181108/
          // TTML Profiles for Internet Media Subtitles and Captions 1.2. Pierre-Anthony Lemieux. W3C. 4 August 2020. W3C Recommendation.
          // URL: https://www.w3.org/TR/2020/REC-ttml-imsc1.2-20200804/
          break;
        case "im2t":
          // TTML Profiles for Internet Media Subtitles and Captions 1.1. Pierre-Anthony Lemieux. W3C. 8 November 2018. W3C Recommendation.
          // URL: https://www.w3.org/TR/2018/REC-ttml-imsc1.1-20181108/
          break;
        case "im3t":
          // TTML Profiles for Internet Media Subtitles and Captions 1.2. Pierre-Anthony Lemieux. W3C. 4 August 2020. W3C Recommendation.
          // URL: https://www.w3.org/TR/2020/REC-ttml-imsc1.2-20200804/
          break;
        case "rtp1":
          // RTP Payload for Timed Text Markup Language (TTML). J. Sandford. IETF. March 2020. Proposed Standard.
          // URL: https://tools.ietf.org/html/rfc8759
          break;
        case "tt1f":
          // Timed Text Markup Language 1 (TTML1) (Third Edition). Glenn Adams; Pierre-Anthony Lemieux. W3C. 8 November 2018. W3C Recommendation.
          // URL: https://www.w3.org/TR/2018/REC-ttml1-20181108/
          res += "TTML1 full";
          break;
        case "tt1p":
          // Timed Text Markup Language 1 (TTML1) (Third Edition). Glenn Adams; Pierre-Anthony Lemieux. W3C. 8 November 2018. W3C Recommendation.
          // URL: https://www.w3.org/TR/2018/REC-ttml1-20181108/
          res += "TTML1 presentation";
          break;
        case "tt1s":
          // TTML Simple Delivery Profile for Closed Captions (US). Glenn Adams; Monica Martin; Sean Hayes. W3C. 5 February 2013. W3C Note.
          // URL: https://www.w3.org/TR/2013/NOTE-ttml10-sdp-us-20130205/
          res += "TTML1 simple delivery for closed captions (US)";
          break;
        case "tt1t":
          // Timed Text Markup Language 1 (TTML1) (Third Edition). Glenn Adams; Pierre-Anthony Lemieux. W3C. 8 November 2018. W3C Recommendation.
          // URL: https://www.w3.org/TR/2018/REC-ttml1-20181108/
          res += "TTML1 transformation";
          break;
        case "tt2f":
          // Timed Text Markup Language 2 (TTML2). Glenn Adams; Cyril Concolato. W3C. 8 November 2018. W3C Recommendation.
          // URL: https://www.w3.org/TR/2018/REC-ttml2-20181108/
          res += "TTML2 full";
          break;
        case "tt2p":
          // Timed Text Markup Language 2 (TTML2). Glenn Adams; Cyril Concolato. W3C. 8 November 2018. W3C Recommendation.
          // URL: https://www.w3.org/TR/2018/REC-ttml2-20181108/
          res += "TTML2 presentation";
          break;
        case "tt2t":
          // Timed Text Markup Language 2 (TTML2). Glenn Adams; Cyril Concolato. W3C. 8 November 2018. W3C Recommendation.
          // URL: https://www.w3.org/TR/2018/REC-ttml2-20181108/
          res += "TTML2 transformation";
          break;
        default:
          res = warn(`unknown TTML mode "${parts[2]}`);
          break;
        }
      } else res = "generic timed text";
    } else res = warn(`unknown STPP mode "${parts[1]}"`);
  } else res = err(`unknown format "${val}"`);
  return res;
}

export function registerText(addHandler) {
  addHandler("stpp", "XML timed-text subtitles", decodeSTPP);
  addHandler("wvtt", "WebVTT");
}
