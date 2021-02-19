pipeline {
    agent any
    tools {nodejs "node"}

    stages {
        stage('Example') {
            steps {
                sh 'npm config ls'
            }
        }
        stage('Create-Docker-Deploy-ECR') {
            steps {
                //run the script to create Docker Container and deploy in ECR repository
                //this is a makefile that combines docker and aws install of container
                sh "make ECR_REPO_URI='743327341874.dkr.ecr.us-east-1.amazonaws.com/nextiva-aws-example-repository'"
            }
    //    }
    //    stage('Deploy CloudFormation') {
                // this step runs deploy.js to
    //        steps {

                //run the cloudformation template that builds
                // neccessary resources for the AWS stack. Note: uses the SAM cli
//                sh "node ./deploy.js -b recording-demo-james-deploy-bucket -s recording-demo-cnf-stack -i 123456789012.dkr.ecr.us-east-1.amazonaws.com/recording-demo:latest -r us-east-1"
//            }
        }
    }
}