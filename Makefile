init:
	$(info pulling amazon/aws-cli)
	docker pull amazon/aws-cli
	docker run $(AWS_CREDS_BIND) $(S3_BUCKET_BIND) amazon/aws-cli --version
	$(info  pulling aws python build image)
	docker pull amazon/aws-sam-cli-build-image-python3.8
	docker run $(AWS_CREDS_BIND) $(S3_BUCKET_BIND) $(TEMPLATE_BIND) $(BUILD_BIND) $(SRC_BIND) amazon/aws-sam-cli-build-image-python3.8 sam --version