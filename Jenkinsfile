pipeline {
    agent any
    stages {
        stage('Create-Docker-Deploy-ECR') {
            steps {
                //run the script to create Docker Container and deploy in ECR repository
                //this is a makefile that combines docker and aws install of container
                withCredentials([usernamePassword(credentialsId: 'e3bddfaa-07ac-42b3-a090-d838a8f386a6', passwordVariable: '', usernameVariable: '')]) {
                sh "sudo chmod 777 /var/run/docker.sock"
                sh "docker build -t 'nextiva-aws-example-repository' ."
                }
            }
        }
    }
}