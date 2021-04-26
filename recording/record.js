// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const { spawn } = require('child_process');
const { S3Uploader } = require('./utils/upload');

const MEETING_URL = process.env.MEETING_URL || 'Not present in environment';
console.log(`[recording process] MEETING_URL: ${MEETING_URL}`);

const args = process.argv.slice(2);
const BUCKET_NAME = args[0];
console.log(`[recording process] BUCKET_NAME: ${BUCKET_NAME}`);
const BROWSER_SCREEN_WIDTH = args[1];
const BROWSER_SCREEN_HEIGHT = args[2];
console.log(`[recording process] BROWSER_SCREEN_WIDTH: ${BROWSER_SCREEN_WIDTH}, BROWSER_SCREEN_HEIGHT: ${BROWSER_SCREEN_HEIGHT}`);

const VIDEO_BITRATE = 3000;
const VIDEO_FRAMERATE = 30;
const VIDEO_GOP = VIDEO_FRAMERATE * 2;
const AUDIO_BITRATE = '160k';
const AUDIO_SAMPLERATE = 44100;
const AUDIO_CHANNELS = 2
const DISPLAY = process.env.DISPLAY;