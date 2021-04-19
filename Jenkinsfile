// ===================================================================
// Jenkins Pipeline script for building recording application on AWS
// Dependency - AWS Credentials visible by Jenkins in ~/.aws
// Gets Docker image of AWS CLI
// Gets Docker image of AWS SAM CLI
// Builds a Docker image of application to deploy
// Pushes image to AWS ECR using AWS CLI
// Builds AWS S3 Bucket using AWS CLI
// Builds AWS S3 Bucket for holding log file
// Deploys resources to AWS using SAM CLI
// Configures AWS Resource using AWS CLI
// ====================================================================

// Troubleshooting:
// 1. first the home path to jenkins might not match path jenkins is using for 
// workspace. HOME_PATH HOME_RUN_PATH might be different. if they are, be certain
// to specify that.
// 2. ensure that the .aws folder with credentials exists for jenkins home
// 3. docker might not work. the only fix I found was this workaround: chmod 777 /var/run/docker.sock


// JENKINS configuration settings

// pipeline specific settings

def JENKINS_WORKSPACE_SCRIPT_NAME = "test-aws-chime"
// The ECR ARN
def ECR_ARN = "743327341874.dkr.ecr.us-east-1.amazonaws.com/nextiva-aws-example-repository"
def ECR_NAME = "nextiva-aws-example-repository"
// Base path to application path
def HOME_PATH = "/home/jenkins"
def HOME_RUN_PATH = "/var/lib/jenkins"
def BASE_PATH = "${HOME_RUN_PATH}/workspace/${JENKINS_WORKSPACE_SCRIPT_NAME}"
def AWS_REGION = "us-east-1"
def DOCKER_TAG = "latest"
// name of the bucket to save recording logging files to
def S3_BUCKET_LOG = "nextiva-connect-media-recordings-log"
// name of the bucket to deploy recordings
def S3_BUCKET = "nextiva-connect-media-recordings"
def S3_BUCKET_ERROR = "An error occurred (404) when calling the HeadBucket operation: Not Found"
// AWS path to the EC2 instance that will be spun up to deploy docker application to on AWS
def EC2_AIM_IMAGE_NAME = "/aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id"
// name to give the cloudformation stack on AWS
def STACK_NAME = "recording-demo-a123-stack"
// variables to make working with Docker image of AWS CLI and AWS SAM CLI easier
// parameters to mount the volume on server and map to a volume on Docker images
def SAM_TEMPLATE = "/tmp/templates/RecordingDemoCloudformationTemplate.yaml"
def SAM_BUILD_TEMPLATE = "/tmp/build/packaged.yaml"
def S3_CONFIG = "/tmp/s3-config/s3config.json"
def S3_V = "-v ${HOME_RUN_PATH}/s3-config:/tmp/s3-config"
def D_V_C = "-v ${HOME_PATH}/.aws:/root/.aws"
def D_S_V_T = "-v ${BASE_PATH}/templates:/tmp/templates/"
def D_S_V_B = "-v ${BASE_PATH}/build:/tmp/build"
def D_S_V_S = "-v ${BASE_PATH}/src:/tmp/src"
// command to run AWS CLI via Docker
def DOCKER_AWS_CMD = "docker run ${D_V_C} ${S3_V} amazon/aws-cli"
// command to run AWS SAM CLI via Docker
def DOCKER_AWS_SAM_CMD = "docker run ${D_V_C} ${D_S_V_T} ${D_S_V_B} ${D_S_V_S} amazon/aws-sam-cli-build-image-python3.8 sam"


// node('slave_golang') {
pipeline {
    agent any
    stages {
    stage('Ensure AWS Resources') 
    {
    steps {
        script
        {
            // ensure that aws cli docker image is installed
            try {
                sh "docker pull amazon/aws-cli"
                sh "${DOCKER_AWS_CMD} --version"
            }
            catch(err){
                echo 'could not get aws docker image'
                echo ${err}
                currentBuild.result = 'FAILURE'
            }
            // ensure that aws SAM cli docker image is installed
            try {
                sh "docker pull amazon/aws-sam-cli-build-image-python3.8"
                sh "${DOCKER_AWS_SAM_CMD} --version"
            }
            catch(err){
                echo 'could not get aws sam docker image'
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
    stage('Create-Docker-Deploy-ECR') 
    {
        steps {
        script
        {
            // might get docker errors so need docker chmod 777 /var/run/docker.sock"
            sh "${DOCKER_AWS_CMD} ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_ARN}"
            sh "docker build -t  ${ECR_NAME} ."
            sh "docker tag ${ECR_NAME}:${DOCKER_TAG} ${ECR_ARN}:${DOCKER_TAG}"
            sh "docker push ${ECR_ARN}:${DOCKER_TAG}"
        }
        }
    }
    stage('Create S3 Bucket') 
    {
        steps {
        script
        {
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
    stage('Create S3 logging Bucket') 
    {
        steps {
        script
        {
            try {
                sh "${DOCKER_AWS_CMD} s3 mb s3://${S3_BUCKET_LOG} --region ${AWS_REGION}"
                echo 'bucket created'
            }
            catch(err){
                echo ${err}
                currentBuild.result = 'FAILURE'
            }
        }
        }
    }
    stage('Deploy CloudFormation Resources')
    {
        steps {
        script 
        {
            try {
                sh "${DOCKER_AWS_SAM_CMD} package --s3-bucket ${S3_BUCKET} --template-file ${SAM_TEMPLATE} --output-template-file ${SAM_BUILD_TEMPLATE} --region ${AWS_REGION}"
                echo '${DOCKER_AWS_SAM_CMD} template packaged'
            }
            catch(err){
                echo ${err}
                currentBuild.result = 'FAILURE'
            }
            try {
                sh "${DOCKER_AWS_SAM_CMD} deploy --template-file ${SAM_BUILD_TEMPLATE} --stack-name ${STACK_NAME} --parameter-overrides ECRDockerImageArn=${ECR_ARN} --capabilities CAPABILITY_IAM --region ${AWS_REGION} --no-fail-on-empty-changeset"
            }
            catch(err){
                echo ${err}
                echo '${DOCKER_AWS_SAM_CMD} deployment failed '
                currentBuild.result = 'FAILURE'
            }
            try {
                // add archiving rule to s3 bucket for glacier archiving
                sh "${DOCKER_AWS_CMD} s3api put-bucket-lifecycle --bucket ${S3_BUCKET} --lifecycle-configuration file://${S3_CONFIG}"
            }
            catch(err){
                echo ${err}
                echo '$"{S3_BUCKET} glacier configuration failed.'
                currentBuild.result = 'FAILURE'
            }
            try {
                // add archiving rule to s3 bucket for logs for glacier archiving
                sh "${DOCKER_AWS_CMD} s3api put-bucket-lifecycle --bucket ${S3_BUCKET_LOG} --lifecycle-configuration file://${S3_CONFIG}"
            }
            catch(err){
                echo ${err}
                echo '$"{S3_BUCKET_LOG} glacier configuration failed.'
                currentBuild.result = 'FAILURE'
            }
        }
        }
    }
    stage('Configure AutoScaling Post CloudFormation')
    {
        steps {
        script
        {
            try {
                def invokeUrl = sh (script:"${DOCKER_AWS_CMD} cloudformation describe-stacks --stack-name ${STACK_NAME} --query Stacks[0].Outputs[0].OutputValue --output text --region ${AWS_REGION}", returnStdout:true).trim()
                       
                def ecsClusterName = sh (script:"${DOCKER_AWS_CMD} cloudformation describe-stacks --stack-name ${STACK_NAME} --query Stacks[0].Outputs[1].OutputValue --output text --region ${AWS_REGION}", returnStdout:true).trim()

                def autoScalingGroupName = sh (script:"${DOCKER_AWS_CMD} cloudformation describe-stacks --stack-name ${STACK_NAME} --query Stacks[0].Outputs[2].OutputValue --output text --region ${AWS_REGION}", returnStdout:true).trim()

                sh script:"${DOCKER_AWS_CMD} autoscaling update-auto-scaling-group --auto-scaling-group-name $autoScalingGroupName --new-instances-protected-from-scale-in", returnStdout:true

                def asg = sh (script:"${DOCKER_AWS_CMD} autoscaling describe-auto-scaling-groups --auto-scaling-group-name $autoScalingGroupName", returnStdout:true).trim()
                def jsonAsg = readJSON text: asg 

                def autoScalingGroupArn = jsonAsg.AutoScalingGroups[0].AutoScalingGroupARN
                def autoScalingGroupCapacityProviderName = autoScalingGroupName + 'CapacityProvider';

                def autoScalingGroupInstances = jsonAsg.AutoScalingGroups[0].Instances.InstanceId
                            
                sh "${DOCKER_AWS_CMD} autoscaling set-instance-protection --auto-scaling-group-name ${autoScalingGroupName} --protected-from-scale-in --instance-ids ${autoScalingGroupInstances[0]} ${autoScalingGroupInstances[1]}"

                sh "${DOCKER_AWS_CMD} ecs create-capacity-provider --name ${autoScalingGroupCapacityProviderName} --auto-scaling-group-provider autoScalingGroupArn=${autoScalingGroupArn},managedScaling={status=ENABLED,targetCapacity=60,minimumScalingStepSize=1,maximumScalingStepSize=1},managedTerminationProtection=ENABLED"

                sh "${DOCKER_AWS_CMD} ecs put-cluster-capacity-providers --cluster ${ecsClusterName} --capacity-providers ${autoScalingGroupCapacityProviderName} --default-capacity-provider-strategy capacityProvider=${autoScalingGroupCapacityProviderName}"

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
// }