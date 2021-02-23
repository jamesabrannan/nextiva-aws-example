def ECR_ARN = "743327341874.dkr.ecr.us-east-1.amazonaws.com/nextiva-aws-example-repository"
def ECR_NAME = "nextiva-aws-example-repository"
def AWS_REGION = "us-east-1"
def DOCKER_TAG = "latest"
pipeline {
    agent any

    stages {
        stage('Create-Docker-Deploy-ECR') {
            steps {
                // need to do this cause can't figure out docker chmod 777 /var/run/docker.sock"
                sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_ARN}"
                sh "docker build -t  ${ECR_NAME} ."
                sh "docker tag ${ECR_NAME}:${DOCKER_TAG} ${ECR_ARN}:${DOCKER_TAG}"
                sh "docker push ${ECR_ARN}:${DOCKER_TAG}"
            }
        }
        stage('Create S3 Bucket') {
            steps{
                script{
                    def isbucket = sh "aws s3api head-bucket --bucket ${S3_BUCKET} --region ${AWS_REGION}"
                    echo ${isbucket}
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