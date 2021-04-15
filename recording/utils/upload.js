/* Copyright (c) 2021 Nextiva, Inc. to Present.
 * All rights reserved.
 * Connect-Media-Recordings
 * Modified from code by Amazon.com
 *
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Log media call recording to S3 bucket
 *
 */

const AWS = require("aws-sdk");
const logger = require("./logger.js")(module);

const loggerFile = "[upload.js]";

class S3Uploader {
  /**
   * @constructor
   * @param {*} bucket - the S3 bucket name uploaded to
   * @param {*} key - the file name in S3 bucket
   */
  constructor(bucket, key) {
    this.bucket = bucket;
    this.key = key;
    this.s3Uploader = new AWS.S3({ params: { Bucket: bucket, Key: key } });
    logger.log(
      "info",
      `${loggerFile} constructed a S3 object with bucket: ${this.bucket}, key: ${this.key}`
    );
  }

  uploadStream(stream) {
    logger.log("debug", `${loggerFile} in upload.uploadStream`);
    const managedUpload = this.s3Uploader.upload(
      { Body: stream },
      (err, data) => {
        if (err) {
          logger.log(
            "error",
            "${loggerFile} - failure - error handling on failure",
            err
          );
        } else {
          logger.log(
            "info",
            `${loggerFile} - success - uploaded the file to: ${data.Location}`
          );
          logger.log("debug", "process.exit called.");
          process.exit();
        }
      }
    );
    managedUpload.on("httpUploadProgress", function (event) {
      logger.log(
        "info",
        `${loggerFile}: on httpUploadProgress ${event.loaded} bytes`
      );
    });
  }
}

module.exports = {
  S3Uploader,
};
