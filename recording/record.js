/* Copyright (c) 2021 Nextiva, Inc. to Present.
 * All rights reserved.
 * Connect-Media-Recordings
 *
 * Recording Chime Meeting using ffmpeg to S3 bucket
 * Note: if working local, then specify config params in default.json
 * and you can work with a local ffmpeg that mimicks input
 * and output of the actual application running on ec2 instance.
 *
 * Real functionality uses docker that creates an X11 terminal running firefox that is
 * recorded for saving as a file. Rather than duplicating docker/linux setup, set the
 * debug option to true and then use OSX with ffmpeg, as used in this script for simplicity
 *
 * If developing locally, before running, be certain to get the correct index number for screen
 * capture and audio capture using this command from command-line
 * ffmpeg -f avfoundation -list_devices true -i ""
 *
 * call recording with bucket-name, corporate-account-id, media-call-id, screen width, screen height
 *
 * Save the recording locally, upon termination, stream the file to S3
 * When S3 is finished uploading, delete the temporary file.
 */

const { spawn } = require("child_process");
const { S3Uploader } = require("./utils/upload");
const logger = require("./utils/logger.js")(module);
const config = require("config");
var fs = require("fs");
const { stderr, stdout } = require("process");

const loggerFile = "[record.js]";

// folder to hold the temporary recordings
// note: no need to delete the temporary recordings as the Docker instance
// is terminated after recording completes and deletes recording

var recordingsFolder = config.get("environment-config.tempRecordingFolder");

// get the bucket name and height and width of screen from
// shell script

const origArgs = process.argv;

logger.log(
  "debug",
  `${loggerFile}: original arguments before slicing: ${origArgs}`
);

//exec node /recording/record.js ${SCREEN_WIDTH} ${SCREEN_HEIGHT} ${S3_BUCKET_NAME} ${CORPORATE_ACCOUNT_NUMBER} ${MEDIA_CALL_ID}

const args = process.argv.slice(2);
const BROWSER_SCREEN_WIDTH = args[0];
const BROWSER_SCREEN_HEIGHT = args[1];
const BUCKET_NAME = args[2];
const CORP_ACCNT_ID = args[3];
const MEDIA_CALL_ID = args[4];

logger.log("debug", `arguments: ${args}`);

logger.log(
  "info",
  `${loggerFile} BUCKET_NAME: ${BUCKET_NAME} CORP_ACCNT_ID: ${CORP_ACCNT_ID} MEDIA_CALL_ID: ${MEDIA_CALL_ID} Width: ${BROWSER_SCREEN_WIDTH} Height: ${BROWSER_SCREEN_HEIGHT}`
);

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const { spawn } = require('child_process');
const { S3Uploader } = require('./utils/upload');

const MEETING_URL = process.env.MEETING_URL || 'Not present in environment';
console.log(`[recording process] MEETING_URL: ${MEETING_URL}`)

const VIDEO_BITRATE = 3000;
const VIDEO_FRAMERATE = 30;
const VIDEO_GOP = VIDEO_FRAMERATE * 2;
const AUDIO_BITRATE = '160k';
const AUDIO_SAMPLERATE = 44100;
const AUDIO_CHANNELS = 2
const DISPLAY = process.env.DISPLAY;

const transcodeStreamToOutput = spawn('ffmpeg',[
    '-hide_banner',
    '-loglevel', 'error',
    // disable interaction via stdin
    '-nostdin',
    // screen image size
    '-s', `${BROWSER_SCREEN_WIDTH}x${BROWSER_SCREEN_HEIGHT}`,
    // video frame rate
    '-r', `${VIDEO_FRAMERATE}`,
    // hides the mouse cursor from the resulting video
    '-draw_mouse', '0',
    // grab the x11 display as video input
    '-f', 'x11grab',
        '-i', `${DISPLAY}`,
    // grab pulse as audio input
    '-f', 'pulse', 
        '-ac', '2',
        '-i', 'default',
    // codec video with libx264
    '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-profile:v', 'main',
        '-preset', 'veryfast',
        '-x264opts', 'nal-hrd=cbr:no-scenecut',
        '-minrate', `${VIDEO_BITRATE}`,
        '-maxrate', `${VIDEO_BITRATE}`,
        '-g', `${VIDEO_GOP}`,
    // apply a fixed delay to the audio stream in order to synchronize it with the video stream
    '-filter_complex', 'adelay=delays=1000|1000',
    // codec audio with aac
    '-c:a', 'aac',
        '-b:a', `${AUDIO_BITRATE}`,
        '-ac', `${AUDIO_CHANNELS}`,
        '-ar', `${AUDIO_SAMPLERATE}`,
    // adjust fragmentation to prevent seeking(resolve issue: muxer does not support non seekable output)
    '-movflags', 'frag_keyframe+empty_moov',
    // set output format to mp4 and output file to stdout
    '-f', 'mp4', '-'
    ]
);

transcodeStreamToOutput.stderr.on('data', data => {
    console.log(`[transcodeStreamToOutput process] stderr: ${(new Date()).toISOString()} ffmpeg: ${data}`);
});

const timestamp = new Date();
const fileTimestamp = timestamp.toISOString().substring(0,19);
const year = timestamp.getFullYear();
const month = timestamp.getMonth() + 1;
const day = timestamp.getDate();
const hour = timestamp.getUTCHours();
const fileName = `${year}/${month}/${day}/${hour}/${fileTimestamp}.mp4`;
new S3Uploader(BUCKET_NAME, fileName).uploadStream(transcodeStreamToOutput.stdout);

// event handler for docker stop, not exit until upload completes
process.on('SIGTERM', (code, signal) => {
    console.log(`[recording process] exited with code ${code} and signal ${signal}(SIGTERM)`);
    process.kill(transcodeStreamToOutput.pid, 'SIGTERM');
});

// debug use - event handler for ctrl + c
process.on('SIGINT', (code, signal) => {
    console.log(`[recording process] exited with code ${code} and signal ${signal}(SIGINT)`)
    process.kill('SIGTERM');
});

process.on('exit', function(code) {
    console.log('[recording process] exit code', code);
});