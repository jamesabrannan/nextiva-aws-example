def ECR_ARN = "743327341874.dkr.ecr.us-east-1.amazonaws.com/nextiva-aws-example-repository"
def ECR_NAME = "nextiva-aws-example-repository"
def AWS_REGION = "us-east-1"
def DOCKER_TAG = "latest"
def S3_BUCKET = "james-deploy-a123-bucket"
def S3_BUCKET_ERROR = "An error occurred (404) when calling the HeadBucket operation: Not Found"
def EC2_AIM_IMAGE_NAME = "/aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id"
pipeline {
    agent any

    stages {
        stage('Create-Docker-Deploy-ECR') {
            steps {
                script{
                    // ensure that aws and sam are installed
                    try {
                        sh "aws --version"
                        sh "sam --version"
                        echo 'aws and sam installed'
                    }
                    catch(err){
                        echo 'could not find aws or sam installation'
                        echo ${err}
                    }
                    // ensure the EC2 AIM that will be deployed exists
                    try {
                        sh "aws ssm get-parameters --names ${EC2_AIM_IMAGE_NAME} --region ${AWS_REGION} --query Parameters[0].Value"
                        echo "aws aim exists. ${EC2_AIM_IMAGE_NAME}"
                    }
                    catch(err){
                        echo 'the required EC2 AIM not found'
                    }
                }
                // might get docker errors so need docker chmod 777 /var/run/docker.sock"
                sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_ARN}"
                sh "docker build -t  ${ECR_NAME} ."
                sh "docker tag ${ECR_NAME}:${DOCKER_TAG} ${ECR_ARN}:${DOCKER_TAG}"
                sh "docker push ${ECR_ARN}:${DOCKER_TAG}"
            }
        }
        stage('Create S3 Bucket') {
            steps{
                script{
                    try {
                        sh "aws s3 mb s3://${S3_BUCKET} --region ${AWS_REGION}"
                        echo 'bucket created'
                    }
                    catch(err){
                        echo ${err}
                    }
                }
            }
        }


       // stage('Build CloudFormation Stack'){
       //     steps {
       //         sh "node ./deploy.js -b recording-demo-james123-deploy-bucket -s recording-demo-cnf-stack -i 743327341874.dkr.ecr.us-east-1.amazonaws.com///nextiva-aws-example-repository:latest -r us-east-1"
       //     }
       // }
    }
}