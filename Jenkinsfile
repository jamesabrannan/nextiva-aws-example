pipeline {
    agent any
    stages {
        stage('Create-Docker-Deploy-ECR') {
            steps {
                //run the script to create Docker Container and deploy in ECR repository
                //this is a makefile that combines docker and aws install of container
                def testimage = docker.build('nextiva-aws-example-repository')
            }
        }
    }
}