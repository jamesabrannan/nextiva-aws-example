/* Copyright (c) 2021 Nextiva, Inc. to Present.
 * All rights reserved.
 * Connect-Media-Recordings
 * Logger for Winston logging and rotating log file.
 */

var winston = require("winston");
require("winston-daily-rotate-file");
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

// transport for writing to a winston rotating log file

const log_transport = new winston.transports.DailyRotateFile({
  filename: config.get("logConfig.logFolder") + config.get("logConfig.logFile"),
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  prepend: true,
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
