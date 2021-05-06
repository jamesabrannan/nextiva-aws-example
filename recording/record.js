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

//exec node /recording/record.js ${SCREEN_WIDTH} ${SCREEN_HEIGHT} ${S3_BUCKET_NAME} ${CORPORATE_ACCOUNT_ID} ${MEDIA_CALL_ID}

const args = process.argv.slice(2);
const BROWSER_SCREEN_WIDTH = args[0];
const BROWSER_SCREEN_HEIGHT = args[1];
const BUCKET_NAME = args[2];
const CORP_ACCNT_ID = args[3];
const MEDIA_CALL_ID = args[4];

logger.log("debug", `arguments: ${args}`);

logger.log(
  "info",
  `${loggerFile} BUCKET_NAME: ${BUCKET_NAME} CORP_ACCNT_ID: ${CORP_ACCNT_ID} MEDIA_CALL_ID: ${MEDIA_CALL_ID}`
);

// create the file to upload to S3 bucket
// format: year/month/day/hour/media-call-id
// file format: mp4

const s3FileName = `${CORP_ACCNT_ID}/${MEDIA_CALL_ID}.mp4`;

logger.log(
  "debug",
  `${loggerFile} BROWSER_SCREEN_WIDTH: ${BROWSER_SCREEN_WIDTH}, BROWSER_SCREEN_HEIGHT: ${BROWSER_SCREEN_HEIGHT}`
);

logger.log("info", `${loggerFile} S3 Filename: ${s3FileName}`);

// These constants are ignored if running locally

const MEETING_URL = process.env.MEETING_URL || "Not present in environment";
logger.log("info", `${loggerFile}  MEETING_URL: ${MEETING_URL}`);

const VIDEO_BITRATE = 3000;
const VIDEO_FRAMERATE = 30;
const VIDEO_GOP = VIDEO_FRAMERATE * 2;
const AUDIO_BITRATE = "160k";
const AUDIO_SAMPLERATE = 44100;
const AUDIO_CHANNELS = 2;
const DISPLAY = process.env.DISPLAY;

// End ignored constants if running locally

const FFMPEG_LOG_LEVEL = config.get("ffmpeg-config.logLevel");

// if doing local development, assumption is you are using OSX, if Actual Application, then see Docker container.
// fmpeg -f avfoundation -i "1:0" -vf  "crop=1020:1080:0:0" -pix_fmt yuv420p -y -r 30 test.mp4

var transcodeStreamToOutput;

// complete path and temporary name of recording

var recordingName = `${MEDIA_CALL_ID}.mp4`;

// if local development use the local recording settings
// otherwise use the real ffmpeg recording

// -nostdin: run without console stdin
// -y: overwrite file if exists
// -s: screen/browser width x screen/browser height
// -r: framerate to record
// -i: if debug, then assumption is main display output and microphone input
// -t: the timeout in duration before ending recording

var timeout = config.get("environment-config.recordTimeoutDuration");
logger.log("debug", `${loggerFile}: timeout for video: ${timeout}`);

if (config.get("environment-config.isLocal") == true) {
  // debug settings for personal OSX computer's settings, see note above
  // to determine these values

  var INPUT_SCREEN_CAPTURE = "1";
  var INPUT_SOUND_CAPTURE = "0";

  logger.log("debug", `${loggerFile}  in debug environment for ffmpeg`);
  transcodeStreamToOutput = spawn("ffmpeg", [
    "-f",
    "avfoundation",
    "-loglevel",
    `${FFMPEG_LOG_LEVEL}`,
    "-t",
    `${timeout}`,
    "-y",
    "-i",
    `${INPUT_SCREEN_CAPTURE}:${INPUT_SOUND_CAPTURE}`,
    "-vf",
    "crop=1020:1080:1:0",
    "-pix_fmt",
    "yuv420p",
    "-y",
    "-r",
    "30",
    `${recordingName}`
  ]);
} else {
  logger.log(
    "debug",
    `${loggerFile}: running ffmpeg and not in debug environment.`
  );
  transcodeStreamToOutput = spawn("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    `${FFMPEG_LOG_LEVEL}`,
    "-t",
    `${timeout}`,
    "-nostdin",
    "-s",
    `${BROWSER_SCREEN_WIDTH}x${BROWSER_SCREEN_HEIGHT}`,
    // video frame rate
    "-r",
    `${VIDEO_FRAMERATE}`,
    // hides the mouse cursor from the resulting video
    "-draw_mouse",
    "0",
    // grab the x11 display as video input
    "-f",
    "x11grab",
    "-i",
    `${DISPLAY}`,
    // grab pulse as audio input
    "-f",
    "pulse",
    "-ac",
    "2",
    "-i",
    "default",
    // codec video with libx264
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-profile:v",
    "main",
    "-preset",
    "veryfast",
    "-x264opts",
    "nal-hrd=cbr:no-scenecut",
    "-minrate",
    `${VIDEO_BITRATE}`,
    "-maxrate",
    `${VIDEO_BITRATE}`,
    "-g",
    `${VIDEO_GOP}`,
    // apply a fixed delay to the audio stream in order to synchronize it with the video stream
    "-filter_complex",
    "adelay=delays=1000|1000",
    // codec audio with aac
    "-c:a",
    "aac",
    "-b:a",
    `${AUDIO_BITRATE}`,
    "-ac",
    `${AUDIO_CHANNELS}`,
    "-ar",
    `${AUDIO_SAMPLERATE}`,
    // adjust fragmentation to prevent seeking(resolve issue: muxer does not support non seekable output)
    "-movflags",
    "frag_keyframe+empty_moov",
    `${recordingName}`
  ]);
}

// capture the output stream and log to log file and console
// hardcode to error otherwise the logging is very excessive

transcodeStreamToOutput.stderr.on("data", (data) => {
  logger.log(
    "error",
    `${loggerFile}  stderr: ${new Date().toISOString()} ffmpeg: ${data}`
  );
});

// NOTE: TWO different handlers, the SIGTERM is for when running
// in Docker container and the SIGINIT is when running locally and
// using ctrl-c to stop recording

// event handler for docker stop, not exit until upload completes

var timeoutExit = true;

process.on("SIGTERM", (code, signal) => {
  logger.log(
    "info",
    `${loggerFile}: SIGTERM exited with code ${code} and signal ${signal}(SIGTERM)`
  );
  timeoutExit = false;
  process.kill(transcodeStreamToOutput.pid, "SIGTERM");
});

// debug use - event handler for ctrl + c

process.on("SIGINT", (code, signal) => {
  timeoutExit = false;
  logger.log(
    "info",
    `${loggerFile}: SIGINIT: exited with code ${code} and signal ${signal}(SIGINT)`
  );
});

function saveFile(recordingName) {
  logger.log("info", `${loggerFile}: saving ${s3FileName} to S3`);
  fs.readFile(recordingName, (err, data) => {
    if (err) throw err;
    new S3Uploader(BUCKET_NAME, s3FileName).uploadStream(data);
  });
}

// called just before exit. Put "closeout" code here not in exit,
// as exit terminates before saved.

process.on("beforeExit", (code) => {
  // if timeout then log that maximum recording time reached
  if (timeoutExit) {
    logger.log(
      "info",
      `${loggerFile}: maximum recording time reached. ${s3FileName}`
    );
  }
  logger.log(
    "info",
    `${loggerFile}: exit event occurred: recording timeout, saving and persisting to S3, file: ${s3FileName}`
  );
  saveFile(recordingName);
});

process.on("exit", function (code) {
  logger.log("info", `${loggerFile}  exited code:, ${code}`);
});
