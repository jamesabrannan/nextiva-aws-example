def ECR_ARN = "743327341874.dkr.ecr.us-east-1.amazonaws.com/nextiva-aws-example-repository"
def ECR_NAME = "nextiva-aws-example-repository"
def AWS_REGION = "us-east-1"
def DOCKER_TAG = "latest"
def S3_BUCKET = "james-deploy-a123-bucket"
def S3_BUCKET_ERROR = "An error occurred (404) when calling the HeadBucket operation: Not Found"
def EC2_AIM_IMAGE_NAME = "/aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id"
def SAM_TEMPLATE = "./templates/RecordingDemoCloudformationTemplate.yaml"
def SAM_BUILD_TEMPLATE = "./build/packaged.yaml"
def STACK_NAME = "recording-demo-a123-stack"
def DOCKER_AWS_CMD = "docker run amazon/aws-cli"

pipeline {
    agent any

    stages {

        stage('Ensure AWS Resources') {
            steps {
                script{
                    // ensure that aws cli docker image is nstalled
                    try {
                        sh "docker pull amazon/aws-cli"
                        sh "${DOCKER_AWS_CMD} --version"
                    }
                    catch(err){
                        echo 'could not get aws docker image'
                        echo ${err}
                        currentBuild.result = 'FAILURE'
                    }
                    // ensure the EC2 AIM that will be deployed exists
                    try {
                        sh "${DOCKER_AWS_CMD} ssm get-parameters --names ${EC2_AIM_IMAGE_NAME} --region ${AWS_REGION} --query Parameters[0].Value"
                        echo "${DOCKER_AWS_CMD} aim exists. ${EC2_AIM_IMAGE_NAME}"
                    }
                    catch(err){
                        echo 'the required EC2 AIM not found'
                        currentBuild.result = 'FAILURE'
                    }
                }
            }
        }
        stage('Create-Docker-Deploy-ECR') {
            steps{
                // might get docker errors so need docker chmod 777 /var/run/docker.sock"
                sh "${DOCKER_AWS_CMD} ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_ARN}"
                sh "docker build -t  ${ECR_NAME} ."
                sh "docker tag ${ECR_NAME}:${DOCKER_TAG} ${ECR_ARN}:${DOCKER_TAG}"
                sh "docker push ${ECR_ARN}:${DOCKER_TAG}"
            }
        }
        stage('Create S3 Bucket') {
            steps{
                script{
                    try {
                        sh "${DOCKER_AWS_CMD} s3 mb s3://${S3_BUCKET} --region ${AWS_REGION}"
                        echo 'bucket created'
                    }
                    catch(err){
                        echo ${err}
                        currentBuild.result = 'FAILURE'
                    }
                }
            }
        }
    }
}
