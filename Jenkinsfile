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

        stage('Ensure AWS Resources') {
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
                        currentBuild.result = 'FAILURE'
                    }
                    // ensure the EC2 AIM that will be deployed exists
                    try {
                        sh "aws ssm get-parameters --names ${EC2_AIM_IMAGE_NAME} --region ${AWS_REGION} --query Parameters[0].Value"
                        echo "aws aim exists. ${EC2_AIM_IMAGE_NAME}"
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
                        currentBuild.result = 'FAILURE'
                    }
                }
            }
        }
        stage('Deploy CloudFormation Resources'){
            steps {
                script 
                {
                   try {
                        sh "sam package --s3-bucket ${S3_BUCKET} --template-file ${SAM_TEMPLATE} --output-template-file ${SAM_BUILD_TEMPLATE} --region ${AWS_REGION}"
                        echo 'sam template packaged'
                    }
                    catch(err){
                        echo ${err}
                        currentBuild.result = 'FAILURE'
                    }
                    try {
                        sh "sam deploy --template-file ./build/packaged.yaml --stack-name ${STACK_NAME} --parameter-overrides ECRDockerImageArn=${ECR_ARN} --capabilities CAPABILITY_IAM --region ${AWS_REGION} --no-fail-on-empty-changeset"
                    }
                    catch(err){
                        echo ${err}
                        echo 'sam deployment failed '
                       currentBuild.result = 'FAILURE'
                     }
                }
            }
        }

        stage('Configure AutoScaling Post CloudFormation'){
            steps {
                script{
                    try {
                        def invokeUrl = sh (script:"aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query Stacks[0].Outputs[0].OutputValue --output text --region ${AWS_REGION}", returnStdout:true).trim()
                       
                        def ecsClusterName = sh (script:"aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query Stacks[0].Outputs[1].OutputValue --output text --region ${AWS_REGION}", returnStdout:true).trim()

                        def autoScalingGroupName = sh (script:"aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query Stacks[0].Outputs[2].OutputValue --output text --region ${AWS_REGION}", returnStdout:true).trim()

                        sh script:"aws autoscaling update-auto-scaling-group --auto-scaling-group-name $autoScalingGroupName --new-instances-protected-from-scale-in", returnStdout:true

                        def asg = sh (script:"aws autoscaling describe-auto-scaling-groups --auto-scaling-group-name $autoScalingGroupName", returnStdout:true).trim()
                        def jsonAsg = readJSON text: asg 

                        def autoScalingGroupArn = jsonAsg.AutoScalingGroups[0].AutoScalingGroupARN
                        def autoScalingGroupCapacityProviderName = autoScalingGroupName + 'CapacityProvider';

                        def autoScalingGroupInstances = jsonAsg.AutoScalingGroups[0].Instances.InstanceId
                            
                        sh "aws autoscaling set-instance-protection --auto-scaling-group-name ${autoScalingGroupName} --protected-from-scale-in --instance-ids ${autoScalingGroupInstances[0]} ${autoScalingGroupInstances[1]}"

                        sh "aws ecs create-capacity-provider --name ${autoScalingGroupCapacityProviderName} --auto-scaling-group-provider autoScalingGroupArn=${autoScalingGroupArn},managedScaling={status=ENABLED,targetCapacity=60,minimumScalingStepSize=1,maximumScalingStepSize=1},managedTerminationProtection=ENABLED"

                        sh "aws ecs put-cluster-capacity-providers --cluster ${ecsClusterName} --capacity-providers ${autoScalingGroupCapacityProviderName} --default-capacity-provider-strategy capacityProvider=${autoScalingGroupCapacityProviderName}"

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