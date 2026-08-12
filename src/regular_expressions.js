/**
 * @copyright: Copyright (c) 2024-2026
 * @author: Paul Higgs
 * @file: regular_expressions.js
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
export const expressions = {
	AC4: {
		regex: /^ac-4(\.[a-fA-F\d]{1,2}){3}$/i,
		regex_grouped: /^(?<four_cc>(ac-4))\.(?<bitstream_version>([a-fA-F\d]{1,2}))\.(?<presentation_version>([a-fA-F\d]{1,2}))\.(?<mdcompat>([a-fA-F\d]{1,2}))$/,
		format:  'ac-4.<bitstream_version>.<presentation_version>.<mdcompat>'
	},
	AV1: {
		regex: /^av01\.\d\.\d+[MH]\.\d{1,2}((\.\d?)(\.(\d{3})?(\.(\d{2})?(.(\d{2})?(.(\d{2})?(.\d?)?)?)?)?)?)?$/,
		regex_grouped: /^(?<four_cc>(av01))\.(?<profile>(\d))\.(?<level>(\d+))(?<tier>([MH]))\.(?<bitdepth>(\d{1,2}))((\.(?<monochrome>(\d?)))(\.(?<chromaSubsampling>(\d{3}))?(\.(?<colorPrimaries>(\d{2}))?(.(?<transferCharacteristics>(\d{2}))?(.(?<matrixCoefficients>(\d{2}))?(.(?<videoFullRangeFlag>(\d?)))?)?)?)?)?)?$/,
		format: '<sample entry 4CC>.<profile>.<level><tier>.<bitDepth>.<monochrome>.<chromaSubsampling>.<colorPrimaries>.<transferCharacteristics>.<matrixCoefficients>.<videoFullRangeFlag>',
		description: "see https://aomediacodec.github.io/av1-isobmff/#codecsparam"
	},
	IAMF: {
		regex: /^iamf\.\d{3}\.\d{3}\.(Opus|mp4a(\.[a-fA-F\d]{2})(\.\d+)?|flaC|ipcm)/,
		format: '<sample entry 4CC>.<primary profile>.<secondary profile>.<non-IAMF elements>',
		description: "see https://aomediacodec.github.io/iamf/v1.1.0.html#codecsparameter"
	},
	AVC: {
		regex: /^[a-z0-9!"#$%&'()*+,./:;<=>?@[\] ^_`{|}~-]{4}.[a-f0-9]{6}$/i,
		regex_grouped: /^(?<four_cc>([a-z0-9!"#$%&'()*+,./:;<=>?@[\] ^_`{|}~-]{4})).(?<profile>([a-f0-9]{2}))(?<constraints>([a-f0-9]{2}))(?<level>([a-f0-9]{2}))$/i,
		format_suffix: "PPCCLL",
		description: 'PP CC and LL are hexadecimal values'
	},
	AVS3video: { 
		regex: /(avs3|lav3)(\.[a-fA-F\d]{2}){2}$/,
		regex_grouped: /(?<four_cc>(avs3|lav3)).(?<profile>([a-fA-F\d]{2})).(?<level>([a-fA-F\d]{2}))$/,
		format: "(avs3|lav3).<profile>.<level>",
		description: "profile and level are 2 hexadecimal digits"
	}, 
	AVS3audio: {
		regex: /^av3a\.[a-fA-F\d]{1,2}$/,
		regex_grouped: /^(?<four_cc>(av3a)).(?<codec_id>([a-fA-F\d]{1,2}))$/,
		format: "av3a.<codec_id>",
		description: "codec_id is 0 for general high rate coding, 1 for lossless, 2 for general full rate coding"
	},
	AVS2audio: { 
		regex: /^cavs\.[a-fA-F\d]{1,2}$/,
		regex_grouped: /^(?<four_cc>(cavs)).(?<codec_id>([a-fA-F\d]{1,2}))$/,
		format: "cavs.<codec_id>",
		description: "codec_id is 0 for general high rate coding, 1 for lossless"
	},
	DolbyVision: {
		regex: /^(dvav|dvhe|dvh1|dva1|dav1)\.\d{2}\.\d{2}$/,
		regex_grouped: /^(?<codec_type>(dvav|dvhe|dvh1|dva1|dav1))\.(?<bitstream_profile_id>(\d{2}))\.(?<Dolby_Vision_level_id>(\d{2}))$/,
		format: "[Codec_type].[bitstream_profile_ID].[Dolby_Vision_Level_ID]"
	},
	VP9: {
		regex: /^vp09(\.\d{2}){3}(\.(\d{2})?){0,5}$/,
		regex_grouped: /^(?<four_cc>(vp09))\.(?<profile>(\d{2}))\.(?<level>(\d{2}))\.(?<bitDepth>(\d{2}))(\.(?<chromaSubsampling>(\d{2}))?(\.(?<colourPrimaries>(\d{2}))?(\.(?<transferCharacteristics>(\d{2}))?(\.(?<matrixCoefficients>(\d{2}))?(\.(?<videoFullRangeFlag>(\d{2}))?)?)?)?)?)?$/,
		format: '<sample entry 4CC>.<profile>.<level>.<bitDepth>.<chromaSubsampling>.<colourPrimaries>.<transferCharacteristics>.<matrixCoefficients>.<videoFullRangeFlag>'
	},
	VVC: {
		regex: /^(vvc1|vvi1)(\.\d+)(\.[LH]\d+)(\.C[a-zA-Z2-7]+)?(\.S[a-fA-F\d]{1,2}(\+[a-fA-F\d]{1,2})*)?(\.O\d+(\+\d+)?)?$/,
		format: '<sample entry 4CC>.<general_profile_idc>.[LH]<op_level_idc>{.C<general_constraint_info>}{.S<general_sub_profile_idc>}{.O{<OlsIdx>}{+<MaxTid>}}'
	},
	MPEGH: {
		regex: /^mhm(1|2)\.0x[a-fA-F\d]{2}$/,
		regex_grouped: /^(?<four_cc>(mhm(1|2)))\.0x(?<profile_id>([a-fA-F\d]{2}))$/,
		format: '(mhm1 or mhm2).0xLL',
		description: 'LL is 2 hexadecimal digits'
	},
	CUVV: {
		regex: /^cuvv.[01]+$/,
		regex_grouped: /^(?<four_cc>(cuvv)).(?<version_bits>([01])+)$/,
		format: 'cuvv.<verison_bits>',
		description: '<version_bits> indicates the versions of HDR Vivid in the bitstream'
	},
	HEVC: {
		regex: /^(hev1|hvc1)\.([a-zA-Z]?\d{1,3})\.[a-fA-F\d]{1,8}\.[LH]\d{1,3}(\.[a-fA-F\d]{1,2}){1,6}$/,
	}
};