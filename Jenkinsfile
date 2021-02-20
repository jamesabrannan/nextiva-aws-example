pipeline {
    agent any
    tools {nodejs "node"}

    stages {
        stage('Create-Docker-Deploy-ECR') {
            steps {
                //run the script to create Docker Container and deploy in ECR repository
                //this is a makefile that combines docker and aws install of container
                testimage = docker.build('nextiva-aws-example-repository')
            }
        }
    }
}