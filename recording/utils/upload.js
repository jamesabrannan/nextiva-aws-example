// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const AWS = require("aws-sdk");
const logger = require("./utils/logger.js")(module);
const loggerFile = "[upload.js]";

/**
 * S3Upload Class
 * Upload a recording artifact to S3
 */
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
      "debug",
      `${loggerFile} constructed a S3 object with bucket: ${this.bucket}, key: ${this.key}`
    );
  }

  uploadStream(stream) {
    const managedUpload = this.s3Uploader.upload(
      { Body: stream },
      (err, data) => {
        if (err) {
          logger.log(
            "error",
            `${loggerFile} - failure - error handling on failure`,
            err
          );
        } else {
          logger.log(
            "debug",
            `${loggerFile} - success - uploaded the file to: ${data.Location}`
          );
          process.exit();
        }
      }
    );
    managedUpload.on("httpUploadProgress", function (event) {
      logger.log(`${loggerFile}: on httpUploadProgress ${event.loaded} bytes`);
    });
  }
}

module.exports = {
  S3Uploader
};
