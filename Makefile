BASE_PATH := $(shell pwd)
HOME_PATH := /home/jenkins
AWS_REGION := us-east-1

def STACK_NAME = "test-chime-recording-stack"

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

get_ecr_repository:
	@docker run $(AWS_CREDS_BIND) amazon/aws-cli ecr describe-repositories --repository-names $(ECR_REPOSITORY_NAME)

create_ecr_repository:
	-docker run $(AWS_CREDS_BIND) amazon/aws-cli ecr create-repository --region $(AWS_REGION) --repository-name $(ECR_REPOSITORY_NAME) 

create_configure_buckets:
	docker run $(AWS_CREDS_BIND) amazon/aws-cli s3 mb s3://$(S3_CLOUDFORMATION_BUCKET) --region $(AWS_REGION)
	docker run $(AWS_CREDS_BIND) amazon/aws-cli s3 mb s3://$(S3_RECORDING_BUCKET) --region $(AWS_REGION)
	docker run $(AWS_CREDS_BIND) amazon/aws-cli s3 mb s3://$(S3_LOG_BUCKET) --region $(AWS_REGION)

build_image:
	docker run $(AWS_CREDS_BIND) amazon/aws-cli ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(ECR_ARN)
	docker build -t $(ECR_REPOSITORY_NAME) .
	docker tag $(ECR_REPOSITORY_NAME):$(DOCKER_TAG) $(ECR_ARN):$(DOCKER_TAG)
	docker push $(ECR_ARN):$(DOCKER_TAG)

deploy:
	docker run $(AWS_CREDS_BIND) amazon/aws-cli ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(ECR_ARN)
	docker run $(AWS_CREDS_BIND) $(TEMPLATE_BIND) $(BUILD_BIND) $(SRC_BIND) amazon/aws-sam-cli-build-image-python3.8 sam package --s3-bucket $(S3_CLOUDFORMATION_BUCKET) --template-file $(SAM_TEMPLATE) --output-template-file $(SAM_BUILD_TEMPLATE) --region $(AWS_REGION)
	docker run $(AWS_CREDS_BIND) $(TEMPLATE_BIND) $(BUILD_BIND) $(SRC_BIND) amazon/aws-sam-cli-build-image-python3.8 sam  deploy --template-file $(SAM_BUILD_TEMPLATE) --stack-name $(STACK_NAME) --parameter-overrides ECRDockerImageArn=$(ECR_ARN) --parameters ParameterKey=RecordingArtifactsUpload ParameterValue=$(S3_RECORDING_BUCKET) --capabilities CAPABILITY_IAM --region $(AWS_REGION) --no-fail-on-empty-changeset