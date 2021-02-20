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
                withCredentials([usernamePassword(credentialsId: 'e3bddfaa-07ac-42b3-a090-d838a8f386a6', passwordVariable: '', usernameVariable: '')]) {
                // need to do this cause can't figure out docker chmod 777 /var/run/docker.sock"
                sh "make ECR_REPO_URI='743327341874.dkr.ecr.us-east-1.amazonaws.com/nextiva-aws-example-repository'"
                }
            }
        }
        stage('Deploy CloudFormation'){
            steps {
                sh "node ./deploy.js -b recording-demo-james-deploy-bucket -s recording-demo-cnf-stack -i 123456789012.dkr.ecr.us-east-1.amazonaws.com/recording-demo:latest -r us-east-1"
            }
        }
    }
}