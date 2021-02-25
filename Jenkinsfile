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

pipeline {
    agent any

    stages {

        stage('Configure AutoScaling Post CloudFormation'){
            steps {
                script{
                    try {
                        def invokeUrl = sh script:"aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query Stacks[0].Outputs[0].OutputValue --output text --region ${AWS_REGION}".trim(), returnStdout:true
                       
                        def ecsClusterName = sh script:"aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query Stacks[0].Outputs[1].OutputValue --output text --region ${AWS_REGION}".trim(), returnStdout:true

                        def autoScalingGroupName = sh script:"aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query Stacks[0].Outputs[2].OutputValue --output text --region ${AWS_REGION}".trim(), returnStdout:true

                        sh script:"aws autoscaling update-auto-scaling-group --auto-scaling-group-name $autoScalingGroupName --new-instances-protected-from-scale-in", returnStdout:true;

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