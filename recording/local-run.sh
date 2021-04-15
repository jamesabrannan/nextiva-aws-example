#!/bin/bash

# THIS IS FOR LOCAL DEVELOPMENT ONLY
# The purpose of this file is to allow you to run the node.js application
# with no AWS Connectivity, and no X11 window and no firefox and no pulse audio
# that does actual recording.
# this is usefull for logging, error handling, persistence to S3 from local filesystem
# and other features not part of the actual AWS EC2 Instance. You should do
# as much developement as possible via local environment

# Copyright (c) 2021 Nextiva, Inc. to Present.
# All rights reserved.
# Connect-Media-Recordings

SCREEN_WIDTH=${RECORDING_SCREEN_WIDTH:-'1920'}
SCREEN_HEIGHT=${RECORDING_SCREEN_HEIGHT:-'1080'}
SCREEN_RESOLUTION=${SCREEN_WIDTH}x${SCREEN_HEIGHT}
COLOR_DEPTH=24

S3_BUCKET_NAME="nextiva-connect-media-recordings"
MEDIA_CALL_ID="9999abcmediacallid"
CORPORATE_ACCOUNT_ID="134corpaccountid"

# captures entire screen not firefox window only
# example: node recording nextiva-connect-media-recordings 123abc 1024 768

exec node recording.js ${S3_BUCKET_NAME} ${CORPORATE_ACCOUNT_ID} ${MEDIA_CALL_ID} ${SCREEN_WIDTH} ${SCREEN_HEIGHT}