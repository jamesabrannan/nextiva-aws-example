// use winston for a rotating log

const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");


  const logFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.printf(
    info => "${info.timestamp} ${info.level}: ${info.message}",
   ),);

   const transport = new (winston.transports.DailyRotateFile)({
    filename: config.get("logConfig.logFolder") +
    config.get("logConfig.logFile"),
    datePattern: "YYYY-MM-DD-HH",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    prepend: true,
    level: config.get("logConfig.logLevel")
  });

  var logger = new (winston.Logger)({
    transports: [
      transport
    ]
});