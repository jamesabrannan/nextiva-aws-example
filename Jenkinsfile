pipeline {
    agent any
    tools {nodejs "node"}

    stages {
        stage('Create-Docker-Deploy-ECR') {
            steps {
                //run the script to create Docker Container and deploy in ECR repository
                //this is a makefile that combines docker and aws install of container
                sh "make ECR_REPO_URI='743327341874.dkr.ecr.us-east-1.amazonaws.com/nextiva-aws-example-repository'"
            }
        }
    }
}