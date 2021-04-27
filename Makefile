BASE_PATH := $(shell pwd)
HOME_PATH := $$(HOME)
AWS_REGION := us-east-1

#binds credentials path to Docker volume, as cli runs as Docker image
AWS_CREDS_BIND := -v $(BASE_PATH)/aws:/root/.aws

#binds the path to bucket configuration to Docker volume
S3_BUCKET_CFG_BIND := -v $(BASE_PATH)/recording/s3-config:/tmp/s3-config/

#binds the path to the CloudFormation template to the Docker volume
TEMPLATE_BIND := -v $(BASE_PATH)/templates:/tmp/templates/

#the name of the ECR Repository to create
ECR_REPOSITORY_NAME = test-chime-recording-repository

#the name of the bucket to hold recordings
S3_BUCKET := nextiva-connect-media-recordings

#the name of the bucket to hold log
S3_LOG_BUCKET := nextiva-connect-media-recordings-log

init:
	$(info pulling amazon/aws-cli)
	docker pull amazon/aws-cli
	docker run $(AWS_CREDS_BIND) $(S3_BUCKET_CFG_BIND) amazon/aws-cli --version
	$(info  pulling aws python build image)
	docker pull amazon/aws-sam-cli-build-image-python3.8
	docker run $(AWS_CREDS_BIND) $(S3_BUCKET_CFG_BIND) $(TEMPLATE_BIND) $(BUILD_BIND) $(SRC_BIND) amazon/aws-sam-cli-build-image-python3.8 sam --version

create_ecr_repository:
	docker run $(AWS_CREDS_BIND) amazon/aws-cli ecr create-repository --region $(AWS_REGION) --repository-name $(ECR_REPOSITORY_NAME)

create_configure_buckets:
	docker run $(AWS_CREDS_BIND) amazon/aws-cli s3 mb s3://$(S3_BUCKET) --region $(AWS_REGION)
	docker run $(AWS_CREDS_BIND) amazon/aws-cli s3 mb s3://$(S3_LOG_BUCKET) --region $(AWS_REGION)