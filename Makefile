# ---------------------------------------------------------------
#  Copyright (c) 2020 Nextiva, Inc. to Present.
#  All rights reserved.
# ---------------------------------------------------------------
#
# After cloudformation resources are successfully deployed, but before autoscaling setup, the 
# following is printed to stdout which provides URL for recording, this is needed for any app
# that uses the recording application
#
# -------------------------------------------------------------------------------------------------
#
# CloudFormation outputs from deployed stack
# -------------------------------------------------------------------------------------------------
# Outputs                                                                                         
# -------------------------------------------------------------------------------------------------
# Key                 ApiURL                                                                      
# Description         API endpoint URL for Prod environment                                       
# Value               https://khatltypmg.execute-api.us-east-1.amazonaws.com/Prod/recording       
#
# Key                 ECSClusterName                                                              
# Description         Name of the AWS ECS cluster created as part of this deployment              
# Value               ConnectMediaCallsRecordingEC2Cluster                                        
#
# Key                 AutoScalingGroupName                                                        
# Description         Name of the AWS AutoScalingGroup created as part of this deployment         
# Value               test-chime-recording-stack-ECSAutoScalingGroup-IVBCC9Y2VR9D                 
# -------------------------------------------------------------------------------------------------


# note: home path is used for aws credentials while base is used for the path to resources
# assuming jenkins, this is path jenkins is performing build and it is path to jenkins user home
# these two values can be different

BASE_PATH := $(shell pwd)
HOME_PATH := /home/jenkins
AWS_REGION := us-east-1

#name to provide the stack to be deployed on AWS
STACK_NAME := test-chime-recording-stack

#binds credentials path to Docker volume, as cli runs as Docker image
AWS_CREDS_BIND := -v $(HOME_PATH)/.aws:/root/.aws

#binds the path to bucket configuration, path to build, and to src in temp to Docker volume
S3_BUCKET_CFG_BIND := -v $(BASE_PATH)/recording/s3-config:/tmp/s3-config/
BUILD_BIND := -v $(BASE_PATH)/build:/tmp/build
SRC_BIND := -v $(BASE_PATH)/src:/tmp/src

#binds the path to the CloudFormation template to the Docker volume
TEMPLATE_BIND := -v $(BASE_PATH)/templates:/tmp/templates/

#the name of the ECR Repository to create
ECR_REPOSITORY_NAME = james-test-chime-recording-repository

#bucket to hold CloudFormation template
S3_CLOUDFORMATION_BUCKET := james-test-chime-recording-repository-bucket
#bucket to hold recordings
S3_RECORDING_BUCKET := james-nextiva-connect-media-recordings
#bucket to hold log files for recording app
S3_LOG_BUCKET := james-nextiva-connect-media-recordings-log
#configuration file for assigning permissions to recording and log buckets
#note: this is the docker volume path not the real path
S3_CONFIG_FILE := /tmp/s3-config/s3config.json
#Sam template and build template post packaging
#note: not real paths, the docker volume mapping
SAM_TEMPLATE := /tmp/templates/RecordingDemoCloudformationTemplate.yaml
SAM_BUILD_TEMPLATE := /tmp/build/packaged.yaml
#tag to assign the docker tag
DOCKER_TAG := latest

#get the aws and sam cli docker images to run using docker
#test that they work by showing version
init:
	$(info pulling amazon/aws-cli)
	docker pull amazon/aws-cli
	docker run $(AWS_CREDS_BIND) $(S3_BUCKET_CFG_BIND) amazon/aws-cli --version
	$(info  pulling aws python build image)
	docker pull amazon/aws-sam-cli-build-image-python3.8
	docker run $(AWS_CREDS_BIND) $(S3_BUCKET_CFG_BIND) $(TEMPLATE_BIND) $(BUILD_BIND) $(SRC_BIND) amazon/aws-sam-cli-build-image-python3.8 sam --version

#create the ECR repository if it fails then continue (the - is for that)

create_ecr_repository:
	-docker run $(AWS_CREDS_BIND) amazon/aws-cli ecr create-repository --region $(AWS_REGION) --repository-name $(ECR_REPOSITORY_NAME)

#create the S3 bucket to hold the cloudformation template and the recording bucket and the log bucket
#assign archiving rules to recording and log buckets, also remove public access to recording and log buckets

create_configure_buckets:
	docker run $(AWS_CREDS_BIND) amazon/aws-cli s3 mb s3://$(S3_CLOUDFORMATION_BUCKET) --region $(AWS_REGION)
	docker run $(AWS_CREDS_BIND) amazon/aws-cli s3 mb s3://$(S3_RECORDING_BUCKET) --region $(AWS_REGION)
	docker run $(AWS_CREDS_BIND) amazon/aws-cli s3 mb s3://$(S3_LOG_BUCKET) --region $(AWS_REGION)
	docker run $(AWS_CREDS_BIND) $(S3_BUCKET_CFG_BIND) amazon/aws-cli s3api put-bucket-lifecycle --bucket $(S3_RECORDING_BUCKET) --lifecycle-configuration file://$(S3_CONFIG_FILE)
	docker run $(AWS_CREDS_BIND) $(S3_BUCKET_CFG_BIND) amazon/aws-cli s3api put-public-access-block --bucket $(S3_RECORDING_BUCKET) --public-access-block-configuration 'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true'
	docker run $(AWS_CREDS_BIND) $(S3_BUCKET_CFG_BIND) amazon/aws-cli s3api put-bucket-lifecycle --bucket $(S3_LOG_BUCKET) --lifecycle-configuration file://$(S3_CONFIG_FILE)
	docker run $(AWS_CREDS_BIND) $(S3_BUCKET_CFG_BIND) amazon/aws-cli s3api put-public-access-block --bucket $(S3_LOG_BUCKET) --public-access-block-configuration 'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true'

#build the docker image.  log in to AWS, build the image, then upload the image to the ECR repository

build_image:
	$(eval ECR_ARN := $(shell docker run $(AWS_CREDS_BIND) amazon/aws-cli ecr describe-repositories --region $(AWS_REGION) --repository-names $(ECR_REPOSITORY_NAME) | jq '.repositories[0].repositoryUri'))
	docker run $(AWS_CREDS_BIND) amazon/aws-cli ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(ECR_ARN)
	docker build -t $(ECR_REPOSITORY_NAME) .
	docker tag $(ECR_REPOSITORY_NAME):$(DOCKER_TAG) $(ECR_ARN):$(DOCKER_TAG)
	docker push $(ECR_ARN):$(DOCKER_TAG)

#deploy the cloudformation template which builds the resources surrounding the ECR image (lambda function etc.)
#note: parameter-overrides is how paramaters can be passed to the template

deploy:
	$(eval ECR_ARN := $(shell docker run $(AWS_CREDS_BIND) amazon/aws-cli ecr describe-repositories --region $(AWS_REGION) --repository-names $(ECR_REPOSITORY_NAME) | jq '.repositories[0].repositoryUri'))
	docker run $(AWS_CREDS_BIND) $(TEMPLATE_BIND) $(BUILD_BIND) $(SRC_BIND) amazon/aws-sam-cli-build-image-python3.8 sam package --s3-bucket $(S3_CLOUDFORMATION_BUCKET) --template-file $(SAM_TEMPLATE) --output-template-file $(SAM_BUILD_TEMPLATE) --region $(AWS_REGION)
	docker run $(AWS_CREDS_BIND) $(TEMPLATE_BIND) $(BUILD_BIND) $(SRC_BIND) amazon/aws-sam-cli-build-image-python3.8 sam  deploy --template-file $(SAM_BUILD_TEMPLATE) --stack-name $(STACK_NAME) --parameter-overrides ECRDockerImageArn=$(ECR_ARN) RecordingArtifactsUploadBucket=$(S3_RECORDING_BUCKET) --capabilities CAPABILITY_IAM --region $(AWS_REGION) --no-fail-on-empty-changeset

#create the autoscaling group and setup for the ECR image instances

setup_autoscaling:
	$(eval INVOKE_URL := $(shell docker run $(AWS_CREDS_BIND) amazon/aws-cli cloudformation describe-stacks --stack-name $(STACK_NAME) --query Stacks[0].Outputs[0].OutputValue --output text --region $(AWS_REGION)))
	$(eval ECS_CLUSTER_NAME := $(shell docker run $(AWS_CREDS_BIND) amazon/aws-cli cloudformation describe-stacks --stack-name $(STACK_NAME) --query Stacks[0].Outputs[1].OutputValue --output text --region $(AWS_REGION)))
	$(eval AUTO_SCALING_GROUP_NAME := $(shell docker run $(AWS_CREDS_BIND) amazon/aws-cli cloudformation describe-stacks --stack-name $(STACK_NAME) --query Stacks[0].Outputs[2].OutputValue --output text --region $(AWS_REGION)))
	docker run $(AWS_CREDS_BIND) amazon/aws-cli autoscaling update-auto-scaling-group --auto-scaling-group-name $(AUTO_SCALING_GROUP_NAME) --new-instances-protected-from-scale-in --region $(AWS_REGION) 

	$(eval AUTO_SCALING_GROUP_ARN := $(shell docker run $(AWS_CREDS_BIND) amazon/aws-cli autoscaling describe-auto-scaling-groups --auto-scaling-group-name $(AUTO_SCALING_GROUP_NAME) --region $(AWS_REGION) | jq '.AutoScalingGroups[0].AutoScalingGroupARN'))
	
	$(eval AUTO_SCALING_GROUP_CAPACITY_PROVIDER_NAME := $(AUTO_SCALING_GROUP_NAME)CapacityProvider)

	$(eval AUTO_SCALING_GROUP_INSTANCE_ONE := $(shell docker run $(AWS_CREDS_BIND) amazon/aws-cli autoscaling describe-auto-scaling-groups --auto-scaling-group-name $(AUTO_SCALING_GROUP_NAME) --region $(AWS_REGION) | jq '.AutoScalingGroups[0].Instances[0].InstanceId'))

	$(eval AUTO_SCALING_GROUP_INSTANCE_TWO := $(shell docker run $(AWS_CREDS_BIND) amazon/aws-cli autoscaling describe-auto-scaling-groups --auto-scaling-group-name $(AUTO_SCALING_GROUP_NAME) --region $(AWS_REGION) | jq '.AutoScalingGroups[0].Instances[1].InstanceId'))

	docker run $(AWS_CREDS_BIND) amazon/aws-cli autoscaling set-instance-protection --auto-scaling-group-name $(AUTO_SCALING_GROUP_NAME) --protected-from-scale-in --instance-ids $(AUTO_SCALING_GROUP_INSTANCE_ONE) $(AUTO_SCALING_GROUP_INSTANCE_TWO)

	docker run $(AWS_CREDS_BIND) amazon/aws-cli ecs create-capacity-provider --name $(AUTO_SCALING_GROUP_CAPACITY_PROVIDER_NAME) --auto-scaling-group-provider autoScalingGroupArn=$(AUTO_SCALING_GROUP_ARN),managedScaling={status=ENABLED,targetCapacity=60,minimumScalingStepSize=1,maximumScalingStepSize=1},managedTerminationProtection=ENABLED

	docker run $(AWS_CREDS_BIND) amazon/aws-cli ecs put-cluster-capacity-providers --cluster $(ECS_CLUSTER_NAME) --capacity-providers $(AUTO_SCALING_GROUP_CAPACITY_PROVIDER_NAME) --default-capacity-provider-strategy capacityProvider=$(AUTO_SCALING_GROUP_CAPACITY_PROVIDER_NAME)
