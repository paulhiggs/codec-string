/**
 * @copyright: Copyright (c) 2023-2024
 * @author: Paul Higgs
 * @file: dvb-mapping.js
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

const VideoCodecCS = 'urn:dvb:metadata:cs:VideoCodecCS:2022';

const VideoTerms = [
	{ term: '1', codec: 'avc1' },

	{ term: '1.1', codec: 'avc1', profile: 'Baseline' },
	{ term: '1.1.1', codec: 'avc1', profile: 'Baseline', level: '1' },
	{ term: '1.1.2', codec: 'avc1', profile: 'Baseline', level: '1b' },
	{ term: '1.1.3', codec: 'avc1', profile: 'Baseline', level: '1.1' },
	{ term: '1.1.4', codec: 'avc1', profile: 'Baseline', level: '1.2' },
	{ term: '1.1.5', codec: 'avc1', profile: 'Baseline', level: '1.3' },
	{ term: '1.1.6', codec: 'avc1', profile: 'Baseline', level: '2' },
	{ term: '1.1.7', codec: 'avc1', profile: 'Baseline', level: '2.1' },
	{ term: '1.1.8', codec: 'avc1', profile: 'Baseline', level: '2.2' },
	{ term: '1.1.9', codec: 'avc1', profile: 'Baseline', level: '3' },
	{ term: '1.1.10', codec: 'avc1', profile: 'Baseline', level: '3.1' },
	{ term: '1.1.11', codec: 'avc1', profile: 'Baseline', level: '3.2' },
	{ term: '1.1.12', codec: 'avc1', profile: 'Baseline', level: '4' },
	{ term: '1.1.13', codec: 'avc1', profile: 'Baseline', level: '4.1' },
	{ term: '1.1.14', codec: 'avc1', profile: 'Baseline', level: '4.2' },
	{ term: '1.1.15', codec: 'avc1', profile: 'Baseline', level: '5' },
	{ term: '1.1.16', codec: 'avc1', profile: 'Baseline', level: '5.1' },

	{ term: '1.2', codec: 'avc1', profile: 'Main' },
	{ term: '1.2.1', codec: 'avc1', profile: 'Main', level: '1' },
	{ term: '1.2.2', codec: 'avc1', profile: 'Main', level: '1b' },
	{ term: '1.2.3', codec: 'avc1', profile: 'Main', level: '1.1' },
	{ term: '1.2.4', codec: 'avc1', profile: 'Main', level: '1.2' },
	{ term: '1.2.5', codec: 'avc1', profile: 'Main', level: '1.3' },
	{ term: '1.2.6', codec: 'avc1', profile: 'Main', level: '2' },
	{ term: '1.2.7', codec: 'avc1', profile: 'Main', level: '2.1' },
	{ term: '1.2.8', codec: 'avc1', profile: 'Main', level: '2.2' },
	{ term: '1.2.9', codec: 'avc1', profile: 'Main', level: '3' },
	{ term: '1.2.10', codec: 'avc1', profile: 'Main', level: '3.1' },
	{ term: '1.2.11', codec: 'avc1', profile: 'Main', level: '3.2' },
	{ term: '1.2.12', codec: 'avc1', profile: 'Main', level: '4' },
	{ term: '1.2.13', codec: 'avc1', profile: 'Main', level: '4.1' },
	{ term: '1.2.14', codec: 'avc1', profile: 'Main', level: '4.2' },
	{ term: '1.2.15', codec: 'avc1', profile: 'Main', level: '5' },
	{ term: '1.2.16', codec: 'avc1', profile: 'Main', level: '5.1' },

	{ term: '1.3', codec: 'avc1', profile: 'Extended' },
	{ term: '1.3.1', codec: 'avc1', profile: 'Extended', level: '1' },
	{ term: '1.3.2', codec: 'avc1', profile: 'Extended', level: '1b' },
	{ term: '1.3.3', codec: 'avc1', profile: 'Extended', level: '1.1' },
	{ term: '1.3.4', codec: 'avc1', profile: 'Extended', level: '1.2' },
	{ term: '1.3.5', codec: 'avc1', profile: 'Extended', level: '1.3' },
	{ term: '1.3.6', codec: 'avc1', profile: 'Extended', level: '2' },
	{ term: '1.3.7', codec: 'avc1', profile: 'Extended', level: '2.1' },
	{ term: '1.3.8', codec: 'avc1', profile: 'Extended', level: '2.2' },
	{ term: '1.3.9', codec: 'avc1', profile: 'Extended', level: '3' },
	{ term: '1.3.10', codec: 'avc1', profile: 'Extended', level: '3.1' },
	{ term: '1.3.11', codec: 'avc1', profile: 'Extended', level: '3.2' },
	{ term: '1.3.12', codec: 'avc1', profile: 'Extended', level: '4' },
	{ term: '1.3.13', codec: 'avc1', profile: 'Extended', level: '4.1' },
	{ term: '1.3.14', codec: 'avc1', profile: 'Extended', level: '4.2' },
	{ term: '1.3.15', codec: 'avc1', profile: 'Extended', level: '5' },
	{ term: '1.3.16', codec: 'avc1', profile: 'Extended', level: '5.1' },

	{ term: '1.4', codec: 'avc1', profile: 'High' },
	{ term: '1.4.1', codec: 'avc1', profile: 'High', level: '1' },
	{ term: '1.4.2', codec: 'avc1', profile: 'High', level: '1b' },
	{ term: '1.4.3', codec: 'avc1', profile: 'High', level: '1.1' },
	{ term: '1.4.4', codec: 'avc1', profile: 'High', level: '1.2' },
	{ term: '1.4.5', codec: 'avc1', profile: 'High', level: '1.3' },
	{ term: '1.4.6', codec: 'avc1', profile: 'High', level: '2' },
	{ term: '1.4.7', codec: 'avc1', profile: 'High', level: '2.1' },
	{ term: '1.4.8', codec: 'avc1', profile: 'High', level: '2.2' },
	{ term: '1.4.9', codec: 'avc1', profile: 'High', level: '3' },
	{ term: '1.4.10', codec: 'avc1', profile: 'High', level: '3.1' },
	{ term: '1.4.11', codec: 'avc1', profile: 'High', level: '3.2' },
	{ term: '1.4.12', codec: 'avc1', profile: 'High', level: '4' },
	{ term: '1.4.13', codec: 'avc1', profile: 'High', level: '4.1' },
	{ term: '1.4.14', codec: 'avc1', profile: 'High', level: '4.2' },
	{ term: '1.4.15', codec: 'avc1', profile: 'High', level: '5' },
	{ term: '1.4.16', codec: 'avc1', profile: 'High', level: '5.1' },

	{ term: '1.5', codec: 'avc1', profile: 'High 10' },
	{ term: '1.5.1', codec: 'avc1', profile: 'High 10', level: '1' },
	{ term: '1.5.2', codec: 'avc1', profile: 'High 10', level: '1b' },
	{ term: '1.5.3', codec: 'avc1', profile: 'High 10', level: '1.1' },
	{ term: '1.5.4', codec: 'avc1', profile: 'High 10', level: '1.2' },
	{ term: '1.5.5', codec: 'avc1', profile: 'High 10', level: '1.3' },
	{ term: '1.5.6', codec: 'avc1', profile: 'High 10', level: '2' },
	{ term: '1.5.7', codec: 'avc1', profile: 'High 10', level: '2.1' },
	{ term: '1.5.8', codec: 'avc1', profile: 'High 10', level: '2.2' },
	{ term: '1.5.9', codec: 'avc1', profile: 'High 10', level: '3' },
	{ term: '1.5.10', codec: 'avc1', profile: 'High 10', level: '3.1' },
	{ term: '1.5.11', codec: 'avc1', profile: 'High 10', level: '3.2' },
	{ term: '1.5.12', codec: 'avc1', profile: 'High 10', level: '4' },
	{ term: '1.5.13', codec: 'avc1', profile: 'High 10', level: '4.1' },
	{ term: '1.5.14', codec: 'avc1', profile: 'High 10', level: '4.2' },
	{ term: '1.5.15', codec: 'avc1', profile: 'High 10', level: '5' },
	{ term: '1.5.16', codec: 'avc1', profile: 'High 10', level: '5.1' },

	{ term: '1.6', codec: 'avc1', profile: 'High 4:2:2' },
	{ term: '1.6.1', codec: 'avc1', profile: 'High 4:2:2', level: '1' },
	{ term: '1.6.2', codec: 'avc1', profile: 'High 4:2:2', level: '1b' },
	{ term: '1.6.3', codec: 'avc1', profile: 'High 4:2:2', level: '1.1' },
	{ term: '1.6.4', codec: 'avc1', profile: 'High 4:2:2', level: '1.2' },
	{ term: '1.6.5', codec: 'avc1', profile: 'High 4:2:2', level: '1.3' },
	{ term: '1.6.6', codec: 'avc1', profile: 'High 4:2:2', level: '2' },
	{ term: '1.6.7', codec: 'avc1', profile: 'High 4:2:2', level: '2.1' },
	{ term: '1.6.8', codec: 'avc1', profile: 'High 4:2:2', level: '2.2' },
	{ term: '1.6.9', codec: 'avc1', profile: 'High 4:2:2', level: '3' },
	{ term: '1.6.10', codec: 'avc1', profile: 'High 4:2:2', level: '3.1' },
	{ term: '1.6.11', codec: 'avc1', profile: 'High 4:2:2', level: '3.2' },
	{ term: '1.6.12', codec: 'avc1', profile: 'High 4:2:2', level: '4' },
	{ term: '1.6.13', codec: 'avc1', profile: 'High 4:2:2', level: '4.1' },
	{ term: '1.6.14', codec: 'avc1', profile: 'High 4:2:2', level: '4.2' },
	{ term: '1.6.15', codec: 'avc1', profile: 'High 4:2:2', level: '5' },
	{ term: '1.6.16', codec: 'avc1', profile: 'High 4:2:2', level: '5.1' },

	{ term: '1.7', codec: 'avc1', profile: 'High 4:4:4 Predictive' },
	{
		term: '1.7.1',
		codec: 'avc1',
		profile: 'High 4:4:4 Predictive',
		level: '1',
	},
	{
		term: '1.7.2',
		codec: 'avc1',
		profile: 'High 4:4:4 Predictive',
		level: '1b',
	},
	{
		term: '1.7.3',
		codec: 'avc1',
		profile: 'High 4:4:4 Predictive',
		level: '1.1',
	},
	{
		term: '1.7.4',
		codec: 'avc1',
		profile: 'High 4:4:4 Predictive',
		level: '1.2',
	},
	{
		term: '1.7.5',
		codec: 'avc1',
		profile: 'High 4:4:4 Predictive',
		level: '1.3',
	},
	{
		term: '1.7.6',
		codec: 'avc1',
		profile: 'High 4:4:4 Predictive',
		level: '2',
	},
	{
		term: '1.7.7',
		codec: 'avc1',
		profile: 'High 4:4:4 Predictive',
		level: '2.1',
	},
	{
		term: '1.7.8',
		codec: 'avc1',
		profile: 'High 4:4:4 Predictive',
		level: '2.2',
	},
	{
		term: '1.7.9',
		codec: 'avc1',
		profile: 'High 4:4:4 Predictive',
		level: '3',
	},
	{
		term: '1.7.10',
		codec: 'avc1',
		profile: 'High 4:4:4 Predictive',
		level: '3.1',
	},
	{
		term: '1.7.11',
		codec: 'avc1',
		profile: 'High 4:4:4 Predictive',
		level: '3.2',
	},
	{
		term: '1.7.12',
		codec: 'avc1',
		profile: 'High 4:4:4 Predictive',
		level: '4',
	},
	{
		term: '1.7.13',
		codec: 'avc1',
		profile: 'High 4:4:4 Predictive',
		level: '4.1',
	},
	{
		term: '1.7.14',
		codec: 'avc1',
		profile: 'High 4:4:4 Predictive',
		level: '4.2',
	},
	{
		term: '1.7.15',
		codec: 'avc1',
		profile: 'High 4:4:4 Predictive',
		level: '5',
	},
	{
		term: '1.7.16',
		codec: 'avc1',
		profile: 'High 4:4:4 Predictive',
		level: '5.1',
	},

	{ term: '1.8', codec: 'avc1', profile: 'Scalable*' },
	{ term: '1.8.9', codec: 'avc1', profile: 'Scalable*', level: '3' },
	{ term: '1.8.10', codec: 'avc1', profile: 'Scalable*', level: '3.1' },
	{ term: '1.8.11', codec: 'avc1', profile: 'Scalable*', level: '3.2' },
	{ term: '1.8.12', codec: 'avc1', profile: 'Scalable*', level: '4' },
	{ term: '1.8.13', codec: 'avc1', profile: 'Scalable*', level: '4.1' },
	{ term: '1.8.14', codec: 'avc1', profile: 'Scalable*', level: '4.2' },

	{ term: '1.9', codec: 'avc1', profile: 'Stereo*' },
	{ term: '1.9.9', codec: 'avc1', profile: 'Stereo*', level: '3' },
	{ term: '1.9.10', codec: 'avc1', profile: 'Stereo*', level: '3.1' },
	{ term: '1.9.11', codec: 'avc1', profile: 'Stereo*', level: '3.2' },
	{ term: '1.9.12', codec: 'avc1', profile: 'Stereo*', level: '4' },
	{ term: '1.9.13', codec: 'avc1', profile: 'Stereo*', level: '4.1' },
	{ term: '1.9.14', codec: 'avc1', profile: 'Stereo*', level: '4.2' },

	{ term: '2', codec: 'wvc1' },

	{ term: '3', codec: 'h262' },

	{ term: '4', codec: 'hev1' },
	{ term: '4.1', codec: 'hev1', profile: 'Main', tier: 'Main*' },
	{ term: '4.1.1', codec: 'hev1', profile: 'Main', tier: 'Main*', level: '1' },
	{ term: '4.1.6', codec: 'hev1', profile: 'Main', tier: 'Main*', level: '2' },
	{ term: '4.1.7', codec: 'hev1', profile: 'Main', tier: 'Main*', level: '2.1' },
	{ term: '4.1.9', codec: 'hev1', profile: 'Main', tier: 'Main*', level: '3' },
	{ term: '4.1.10', codec: 'hev1', profile: 'Main', tier: 'Main*', level: '3.1' },
	{ term: '4.1.12', codec: 'hev1', profile: 'Main', tier: 'Main*', level: '4' },
	{ term: '4.1.13', codec: 'hev1', profile: 'Main', tier: 'Main*', level: '4.1' },
	{ term: '4.2', codec: 'hev1', profile: 'Main 10', tier: 'Main*' },
	{ term: '4.2', codec: 'hev1', profile: 'Main 10', tier: 'Main*' },
	{ term: '4.2.1', codec: 'hev1', profile: 'Main 10', tier: 'Main*', level: '1' },
	{ term: '4.2.6', codec: 'hev1', profile: 'Main 10', tier: 'Main*', level: '2' },
	{ term: '4.2.7', codec: 'hev1', profile: 'Main 10', tier: 'Main*', level: '2.1' },
	{ term: '4.2.9', codec: 'hev1', profile: 'Main 10', tier: 'Main*', level: '3' },
	{ term: '4.2.10', codec: 'hev1', profile: 'Main 10', tier: 'Main*', level: '3.1' },
	{ term: '4.2.12', codec: 'hev1', profile: 'Main 10', tier: 'Main*', level: '4' },
	{ term: '4.2.13', codec: 'hev1', profile: 'Main 10', tier: 'Main*', level: '4.1' },
	{ term: '4.2.15', codec: 'hev1', profile: 'Main 10', tier: 'Main*', level: '4' },
	{ term: '4.2.16', codec: 'hev1', profile: 'Main 10', tier: 'Main*', level: '5.1' },
	{ term: '4.2.17', codec: 'hev1', profile: 'Main 10', tier: 'Main*', level: '5.2' },
	{ term: '4.2.18', codec: 'hev1', profile: 'Main 10', tier: 'Main*', level: '6' },
	{ term: '4.2.19', codec: 'hev1', profile: 'Main 10', tier: 'Main*', level: '6.1' },

	{ term: '5', codec: 'avs3' },
	{ term: '5.1', codec: 'avs3', profile: 'High 10*' },
	{ term: '5.1.1', codec: 'avs3', profile: 'High 10*', level: '2.0.15' },
	{ term: '5.1.2', codec: 'avs3', profile: 'High 10*', level: '2.0.30' },
	{ term: '5.1.3', codec: 'avs3', profile: 'High 10*', level: '2.0.60' },
	{ term: '5.1.4', codec: 'avs3', profile: 'High 10*', level: '4.0.30' },
	{ term: '5.1.5', codec: 'avs3', profile: 'High 10*', level: '4.0.60' },
	{ term: '5.1.6', codec: 'avs3', profile: 'High 10*', level: '6.0.30' },
	{ term: '5.1.7', codec: 'avs3', profile: 'High 10*', level: '6.4.30' },
	{ term: '5.1.8', codec: 'avs3', profile: 'High 10*', level: '6.0.60' },
	{ term: '5.1.9', codec: 'avs3', profile: 'High 10*', level: '6.4.60' },
	{ term: '5.1.10', codec: 'avs3', profile: 'High 10*', level: '6.0.120' },
	{ term: '5.1.11', codec: 'avs3', profile: 'High 10*', level: '6.4.120' },
	{ term: '5.1.12', codec: 'avs3', profile: 'High 10*', level: '8.0.30' },
	{ term: '5.1.13', codec: 'avs3', profile: 'High 10*', level: '8.4.30' },
	{ term: '5.1.14', codec: 'avs3', profile: 'High 10*', level: '8.0.60' },
	{ term: '5.1.15', codec: 'avs3', profile: 'High 10*', level: '8.4.60' },
	{ term: '5.1.16', codec: 'avs3', profile: 'High 10*', level: '8.0.120' },
	{ term: '5.1.17', codec: 'avs3', profile: 'High 10*', level: '8.4.120' },
	{ term: '5.1.18', codec: 'avs3', profile: 'High 10*', level: '10.0.30' },
	{ term: '5.1.19', codec: 'avs3', profile: 'High 10*', level: '10.4.30' },
	{ term: '5.1.20', codec: 'avs3', profile: 'High 10*', level: '10.0.60' },
	{ term: '5.1.21', codec: 'avs3', profile: 'High 10*', level: '10.4.60' },
	{ term: '5.1.22', codec: 'avs3', profile: 'High 10*', level: '10.0.120' },
	{ term: '5.1.23', codec: 'avs3', profile: 'High 10*', level: '10.4.120' },

	{ term: '6', codec: 'vvc1' },
	{ term: '6.1', codec: 'vvc1', profile: 'Main 10', tier: 'Main*' },
	{ term: '6.1.1', codec: 'vvc1', profile: 'Main 10', tier: 'Main*', level: '3.0' },
	{ term: '6.1.2', codec: 'vvc1', profile: 'Main 10', tier: 'Main*', level: '3.1' },
	{ term: '6.1.3', codec: 'vvc1', profile: 'Main 10', tier: 'Main*', level: '4.0' },
	{ term: '6.1.4', codec: 'vvc1', profile: 'Main 10', tier: 'Main*', level: '4.1' },
	{ term: '6.1.5', codec: 'vvc1', profile: 'Main 10', tier: 'Main*', level: '5.0' },
	{ term: '6.1.6', codec: 'vvc1', profile: 'Main 10', tier: 'Main*', level: '5.1' },
	{ term: '6.1.7', codec: 'vvc1', profile: 'Main 10', tier: 'Main*', level: '5.2' },
	{ term: '6.1.8', codec: 'vvc1', profile: 'Main 10', tier: 'Main*', level: '6.0' },
	{ term: '6.1.9', codec: 'vvc1', profile: 'Main 10', tier: 'Main*', level: '6.1' },
	{ term: '6.1.10', codec: 'vvc1', profile: 'Main 10', tier: 'Main*', level: '6.2' },
];

const AudioCodecCS = 'urn:dvb:metadata:cs:AudioCodecCS:2022';
const AudioTerms = [
	{ term: '1', codec: 'mp4a' },
	{ term: '1.1', codec: 'mp4a', profile: 'Advanced' },
	{ term: '1.1.1', codec: 'mp4a', profile: 'Advanced', level: '1' },
	{ term: '1.1.2', codec: 'mp4a', profile: 'Advanced', level: '2' },
	{ term: '1.1.3', codec: 'mp4a', profile: 'Advanced', level: '4' },
	{ term: '1.1.4', codec: 'mp4a', profile: 'Advanced', level: '5' },
	{ term: '1.2', codec: 'mp4a', profile: 'High Efficiency Advanced' },
	{ term: '1.2.2', codec: 'mp4a', profile: 'High Efficiency Advanced', level: '2' },
	{ term: '1.2.3', codec: 'mp4a', profile: 'High Efficiency Advanced', level: '3' },
	{ term: '1.2.4', codec: 'mp4a', profile: 'High Efficiency Advanced', level: '4' },
	{ term: '1.2.5', codec: 'mp4a', profile: 'High Efficiency Advanced', level: '5' },
	{ term: '1.3', codec: 'mp4a', profile: 'High Efficiency Advanced v2' },
	{ term: '1.3.2', codec: 'mp4a', profile: 'High Efficiency Advanced v2', level: '2' },
	{ term: '1.3.3', codec: 'mp4a', profile: 'High Efficiency Advanced v2', level: '3' },
	{ term: '1.3.4', codec: 'mp4a', profile: 'High Efficiency Advanced v2', level: '4' },
	{ term: '1.3.5', codec: 'mp4a', profile: 'High Efficiency Advanced v2', level: '5' },

	{ term: '3', codec: 'AC3' },
	{ term: '3.1', codec: 'AC3', mode: 'E-AC3' },

	{ term: '4', codec: 'mp4a' },
	{ term: '4.1', codec: 'mp4a', profile: 'Advanced' },
	{ term: '4.1.1', codec: 'mp4a', profile: 'Advanced', level: '1' },

	{ term: '5', codec: 'DTS' },
	{ term: '5.1', codec: 'DTS', level: 'HD' },
	{ term: '5.1.1', codec: 'DTS', level: 'HD', mode: 'dtsc' },
	{ term: '5.1.2', codec: 'DTS', level: 'HD', mode: 'dtse' },
	{ term: '5.1.3', codec: 'DTS', level: 'HD', mode: 'dtsh' },
	{ term: '5.1.4', codec: 'DTS', level: 'HD', mode: 'dtsl' },
	{ term: '5.2', codec: 'DTS', level: 'UHD' },
	{ term: '5.2.1', codec: 'DTS', level: 'UHD', mode: 'dtsx' },
	{ term: '5.2.2', codec: 'DTS', level: 'UHD', mode: 'dtsy' },

	{ term: '6', codec: 'mhm1' },
	{ term: '6.1', codec: 'mhm1', mode: 'LC' },
	{ term: '6.1.1', codec: 'mhm1', mode: 'LC', level: '1' },
	{ term: '6.1.2', codec: 'mhm1', mode: 'LC', level: '2' },
	{ term: '6.1.3', codec: 'mhm1', mode: 'LC', level: '3' },

	{term: '7.1', codec: 'av3a', codec_id:'1' },
	{term: '7.2', codec: 'av3a', codec_id:'2' },
];

function tableLookup(entry) {
	const ek = Object.keys(entry),
		tk = Object.keys(this);
	if (ek.length != tk.length) return false;

	let match_count = 0,
		keys_count = 0;

	ek.forEach((key) => {
		if (key != 'term') {
			keys_count++;

			if (entry[key] && this[key]) {
				const wc = entry[key].indexOf('*');
				const ek2 = wc == -1 ? entry[key] : entry[key].substring(0, wc);
				const tk2 = wc == -1 ? this[key] : this[key].substring(0, wc);
				if (ek2 === tk2) match_count++;
			}
		}
	});

	const rc = keys_count != 0 && match_count == keys_count;
	return rc;
}

function match(cs, terms, params) {
	const found = terms.find(tableLookup, params);
	return found ? `${cs}:${found.term}` : '';
}

export function DVBclassification(params) {
	let res = '';
	if (!params?.type) return res;

	switch (params.type) {
		case 'video':
			// hack to allow hvc1 and hev1 (DVB A168 clasue 5.2.1)
			if (params?.codec == 'hvc1') params.codec = 'hev1';
			res = match(VideoCodecCS, VideoTerms, params);
			break;
		case 'audio':
			res = match(AudioCodecCS, AudioTerms, params);
			break;
	}

	return res;
}

//dbg console.log(`1: ${DVBclassification({ type: "video", codec: "avc1", profile: "High", level: "3.2" })}`);
//dbg console.log(`2: ${DVBclassification({ type: "video", codec: "avc1", profile: "High" })}`);
//dbg console.log(`3: ${DVBclassification({ type: "video", codec: "avc1", profile: "Scalable Exh", level: "4.1" })}`);

//dbgconsole.log(`4: ${DVBclassification({ type: "video", codec: "avs3", profile: "High 10", level: "2.0.60" })}`);
