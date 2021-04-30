BASE_PATH := $(shell pwd)
HOME_PATH := /home/jenkins
AWS_REGION := us-east-1

STACK_NAME := test-chime-recording-stack

#binds credentials path to Docker volume, as cli runs as Docker image
AWS_CREDS_BIND := -v $(HOME_PATH)/.aws:/root/.aws

#binds the path to bucket configuration to Docker volume
S3_BUCKET_CFG_BIND := -v $(BASE_PATH)/recording/s3-config:/tmp/s3-config/

BUILD_BIND := -v $(BASE_PATH)/build:/tmp/build
SRC_BIND := -v $(BASE_PATH)/src:/tmp/src

#binds the path to the CloudFormation template to the Docker volume
TEMPLATE_BIND := -v $(BASE_PATH)/templates:/tmp/templates/

#the name of the ECR Repository to create
ECR_REPOSITORY_NAME = test-chime-recording-repository

#the name of the bucket to hold CloudFormation template
S3_CLOUDFORMATION_BUCKET := test-chime-recording-repository-bucket

S3_RECORDING_BUCKET := nextiva-connect-media-recordings
S3_CONFIG_FILE := /tmp/s3-config/s3config.json

#the name of the bucket to hold log
S3_LOG_BUCKET := nextiva-connect-media-recordings-log

SAM_TEMPLATE := /tmp/templates/RecordingDemoCloudformationTemplate.yaml
SAM_BUILD_TEMPLATE := /tmp/build/packaged.yaml

DOCKER_TAG := latest

init:
	$(info pulling amazon/aws-cli)
	docker pull amazon/aws-cli
	docker run $(AWS_CREDS_BIND) $(S3_BUCKET_CFG_BIND) amazon/aws-cli --version
	$(info  pulling aws python build image)
	docker pull amazon/aws-sam-cli-build-image-python3.8
	docker run $(AWS_CREDS_BIND) $(S3_BUCKET_CFG_BIND) $(TEMPLATE_BIND) $(BUILD_BIND) $(SRC_BIND) amazon/aws-sam-cli-build-image-python3.8 sam --version

create_ecr_repository:
	-docker run $(AWS_CREDS_BIND) amazon/aws-cli ecr create-repository --region $(AWS_REGION) --repository-name $(ECR_REPOSITORY_NAME)

create_configure_buckets:
	docker run $(AWS_CREDS_BIND) amazon/aws-cli s3 mb s3://$(S3_CLOUDFORMATION_BUCKET) --region $(AWS_REGION)
	docker run $(AWS_CREDS_BIND) amazon/aws-cli s3 mb s3://$(S3_RECORDING_BUCKET) --region $(AWS_REGION)
	docker run $(AWS_CREDS_BIND) amazon/aws-cli s3 mb s3://$(S3_LOG_BUCKET) --region $(AWS_REGION)
	docker run $(AWS_CREDS_BIND) $(S3_BUCKET_CFG_BIND) amazon/aws-cli s3api put-bucket-lifecycle --bucket $(S3_RECORDING_BUCKET) --lifecycle-configuration file://$(S3_CONFIG_FILE)
	docker run $(AWS_CREDS_BIND) $(S3_BUCKET_CFG_BIND) amazon/aws-cli s3api put-public-access-block --bucket $(S3_RECORDING_BUCKET) --public-access-block-configuration 'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true'
	docker run $(AWS_CREDS_BIND) $(S3_BUCKET_CFG_BIND) amazon/aws-cli s3api put-bucket-lifecycle --bucket $(S3_LOG_BUCKET) --lifecycle-configuration file://$(S3_CONFIG_FILE)
	docker run $(AWS_CREDS_BIND) $(S3_BUCKET_CFG_BIND) amazon/aws-cli s3api put-public-access-block --bucket $(S3_LOG_BUCKET) --public-access-block-configuration 'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true'

build_image:
	$(eval ECR_ARN := $(shell docker run $(AWS_CREDS_BIND) amazon/aws-cli ecr describe-repositories --region $(AWS_REGION) --repository-names $(ECR_REPOSITORY_NAME) | jq '.repositories[0].repositoryUri'))
	docker run $(AWS_CREDS_BIND) amazon/aws-cli ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(ECR_ARN)
	docker build -t $(ECR_REPOSITORY_NAME) .
	docker tag $(ECR_REPOSITORY_NAME):$(DOCKER_TAG) $(ECR_ARN):$(DOCKER_TAG)
	docker push $(ECR_ARN):$(DOCKER_TAG)

deploy:
	$(eval ECR_ARN := $(shell docker run $(AWS_CREDS_BIND) amazon/aws-cli ecr describe-repositories --region $(AWS_REGION) --repository-names $(ECR_REPOSITORY_NAME) | jq '.repositories[0].repositoryUri'))
	docker run $(AWS_CREDS_BIND) $(TEMPLATE_BIND) $(BUILD_BIND) $(SRC_BIND) amazon/aws-sam-cli-build-image-python3.8 sam package --s3-bucket $(S3_CLOUDFORMATION_BUCKET) --template-file $(SAM_TEMPLATE) --output-template-file $(SAM_BUILD_TEMPLATE) --region $(AWS_REGION)
	docker run $(AWS_CREDS_BIND) $(TEMPLATE_BIND) $(BUILD_BIND) $(SRC_BIND) amazon/aws-sam-cli-build-image-python3.8 sam  deploy --template-file $(SAM_BUILD_TEMPLATE) --stack-name $(STACK_NAME) --parameter-overrides ECRDockerImageArn=$(ECR_ARN) RecordingArtifactsUploadBucket=$(S3_RECORDING_BUCKET) --capabilities CAPABILITY_IAM --region $(AWS_REGION) --no-fail-on-empty-changeset
setup_autoscaling:
	$(eval INVOKE_URL := $(shell docker run $(AWS_CREDS_BIND) amazon/aws-cli cloudformation describe-stacks --stack-name $(STACK_NAME) --query Stacks[0].Outputs[0].OutputValue --output text --region $(AWS_REGION)))
	$(eval ECS_CLUSTER_NAME := $(shell docker run $(AWS_CREDS_BIND) amazon/aws-cli cloudformation describe-stacks --stack-name $(STACK_NAME) --query Stacks[0].Outputs[1].OutputValue --output text --region $(AWS_REGION)))
	$(eval AUTO_SCALING_GROUP_NAME := $(shell docker run $(AWS_CREDS_BIND) amazon/aws-cli cloudformation describe-stacks --stack-name $(STACK_NAME) --query Stacks[0].Outputs[2].OutputValue --output text --region $(AWS_REGION)))
	docker run $(AWS_CREDS_BIND) amazon/aws-cli autoscaling update-auto-scaling-group --auto-scaling-group-name $(AUTO_SCALING_GROUP_NAME) --new-instances-protected-from-scale-in --region $(AWS_REGION) 
	$(eval AUTO_SCALING_GROUP_PROVIDER_NAME := $(AUTO_SCALING_GROUP_NAME)CapacityProvider)
	$(eval AUTO_SCALING_GROUP_INSTANCE_NAME := $(shell docker run $(AWS_CREDS_BIND) amazon/aws-cli autoscaling update-auto-scaling-group --auto-scaling-group-name $(AUTO_SCALING_GROUP_NAME) --new-instances-protected-from-scale-in | jq '.AutoScalingGroups[0].Instances.InstanceId[0]')
	$(info $(AUTO_SCALING_GROUP_INSTANCE_NAME))
	#$(eval AUTO_SCALING_GROUP_INSTANCE_ID := $(shell docker run $(AWS_CREDS_BIND) amazon/aws-cli autoscaling update-auto-scaling-group --auto-scaling-group-name $(AUTO_SCALING_GROUP_NAME) --new-instances-protected-from-scale-in) | jq '.AutoScalingGroups[0].Instances.InstanceId[1]')