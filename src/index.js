// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
// lambda function that is gateway to the chimes backend recording application
// note: this lambda function logs to CloudFormation on AWS, refer to this log
// for logging
// querystring parameters include recordingAction,
// corpAcctNum, mediaCallId
// taskId

"use strict";

var AWS = require("aws-sdk");
var ecs = new AWS.ECS();

// Reading environment variables
const ecsClusterArn = process.env.ecsClusterArn;
const ecsTaskDefinationArn = process.env.ecsTaskDefinationArn;
const ecsContainerName = process.env.ecsContainerName;
const recordingArtifactsBucket = process.env.recordingArtifactsBucket;

let responseBody = {
  message: "",
  input: "",
};

let response = {
  statusCode: 200,
  headers: {},
  body: "",
};

// querystring paramaters:
// recordingAction: start, stop
// meetingURL: url for the meeting that's occuring
// corpAcctNum : corporate account number
// mediaCallId : media call ID

exports.handler = function (event, context, callback) {
  let meetingURL = "";
  let taskId = "";
  let recordingAction = "";
  let mediaCallId = "";
  let corpAcctNum = "";

  console.log(event);
  responseBody.input = event;

  if (
    event.queryStringParameters &&
    event.queryStringParameters.recordingAction
  ) {
    console.log(
      "Recording action: " + event.queryStringParameters.recordingAction
    );
    recordingAction = event.queryStringParameters.recordingAction;
  }

  // perform the requested action, start/stop

  switch (recordingAction.toLowerCase()) {
    case "start":
      if (
        event.queryStringParameters &&
        event.queryStringParameters.meetingURL
      ) {
        console.log("Meeting URL: " + event.queryStringParameters.meetingURL);
        meetingURL = decodeURIComponent(event.queryStringParameters.meetingURL);
        console.log(
          "Corporate Account Number: " + event.queryStringParameters.corpAcctNum
        );
        corpAcctNum = event.queryStringParameters.corpAcctNum;
        console.log("Media call Id: " + event.queryStringParameters.mediaCalId);
        return startRecording(
          event,
          context,
          callback,
          meetingURL,
          corpAcctNum,
          mediaCallId
        );
      } else {
        responseBody = {
          message: "Missing parameter: meetingURL",
          input: event,
        };
        response = {
          statusCode: 400,
          headers: {},
          body: JSON.stringify(responseBody, null, " "),
        };
        context.succeed(response);
      }
    case "stop":
      if (event.queryStringParameters && event.queryStringParameters.taskId) {
        console.log("ECS task ID: " + event.queryStringParameters.taskId);
        taskId = event.queryStringParameters.taskId;
        return stopRecording(event, context, taskId);
      } else {
        responseBody = {
          message: "Missing parameter: taskId",
          input: event,
        };
        response = {
          statusCode: 400,
          headers: {},
          body: JSON.stringify(responseBody, null, " "),
        };
        context.succeed(response);
      }
    default:
      responseBody = {
        message:
          "Invalid parameter: recordingAction. Valid values 'start' & 'stop'",
        input: event,
      };
      response = {
        statusCode: 400,
        headers: {},
        body: JSON.stringify(responseBody),
      };
  }

  console.log("response: " + JSON.stringify(response));
  callback(null, response);
};

// Start a recording pass the context and callback the meetingURL
// corpAcctNum, and mediaCallId

function startRecording(
  event,
  context,
  callback,
  meetingUrl,
  corpAcctNum,
  mediaCallId
) {
  let ecsRunTaskParams = {
    cluster: ecsClusterArn,
    launchType: "EC2",
    count: 1,
    overrides: {
      containerOverrides: [
        {
          environment: [
            {
              name: "MEETING_URL",
              value: meetingUrl,
            },
            {
              name: "RECORDING_ARTIFACTS_BUCKET",
              value: recordingArtifactsBucket,
            },
            {
              name: "CORPORATE_ACCOUNT_NUMBER",
              value: corpAcctNum,
            },
            {
              name: "MEDIA_CALL_ID",
              value: mediaCallId,
            },
          ],
          name: ecsContainerName,
        },
      ],
    },
    placementConstraints: [
      {
        type: "distinctInstance",
      },
    ],
    taskDefinition: ecsTaskDefinationArn,
  };

  ecs.runTask(ecsRunTaskParams, function (err, data) {
    if (err) {
      console.log(err); // an error occurred
      response.statusCode = err.statusCode;
      response.body = JSON.stringify(err, null, " ");
      context.succeed(response);
    } else {
      console.log(data); // successful response
      response.statusCode = 200;
      response.body = JSON.stringify(
        data.tasks.length && data.tasks[0].taskArn
          ? data.tasks[0].taskArn
          : data,
        null,
        " "
      );
      context.succeed(response);
    }
  });
}

function stopRecording(event, context, taskId) {
  let ecsStopTaskParam = {
    cluster: ecsClusterArn,
    task: taskId,
  };

  ecs.stopTask(ecsStopTaskParam, function (err, data) {
    if (err) {
      console.log(err); // an error occurred
      response.statusCode = err.statusCode;
      response.body = JSON.stringify(err, null, " ");
      context.succeed(response);
    } else {
      console.log(data); // successful response
      response.statusCode = 200;
      responseBody = data;
      response.body = JSON.stringify(data, null, " ");
      console.log("Stop task succeeded.", response);
      context.succeed(response);
    }
  });
}
