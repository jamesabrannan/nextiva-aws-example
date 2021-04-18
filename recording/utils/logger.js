/* Copyright (c) 2021 Nextiva, Inc. to Present.
 * All rights reserved.
 * Connect-Media-Recordings
 * Logger for Winston logging to S3 Stream
 * uses the s3-streamlogger npm package
 */

var winston = require("winston");
var S3StreamLogger = require("s3-streamlogger").S3StreamLogger;
const { format } = require("logform");
const config = require("config");
const { createLogger, transports } = require("winston");

var getLabel = function (callingModule) {
  var parts = callingModule.filename.split("/");
  return parts[parts.length - 2] + "/" + parts.pop();
};

// create format needed for Nextiva logging
// example output format: {"message":"[connect-media-recordings] logger is created with console and
//      logfile transport","level":"debug","timestamp":"2021-03-25T05:14:08.847Z"}

const logformat = format.combine(
  format.label({ label: config.get("logConfig.logLabel"), message: true }),
  format.timestamp(),
  format.printf(
    (info) => "${info.label} ${info.timestamp} ${info.level}: ${info.message}"
  )
);

// transport for writing to S3 Stream, this must be a valid bucket and
// must have the credentials in ~/.aws/credentials file

var s3_stream = new S3StreamLogger({
  bucket: config.get("logConfig.logBucketName"),
});

const log_transport = new winston.transports.Stream({
  stream: s3_stream,
  format: winston.format.json(),
  level: config.get("logConfig.logLevel"),
});

// transport for writing winson logging to console

const console_transport = new winston.transports.Console({
  format: winston.format.json(),
  level: config.get("logConfig.logLevel"),
});

// create winston logger and export

module.exports = function (callingModule) {
  return winston.createLogger({
    format: logformat,
    transports: [log_transport, console_transport],
    exitOnError: false,
  });
};
