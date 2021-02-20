pipeline {
    agent any
    tools {nodejs "node"}

    stages {
        stage('Create-Docker-Deploy-ECR') {
            steps {
                //run the script to create Docker Container and deploy in ECR repository
                //this is a makefile that combines docker and aws install of container
                withCredentials([usernamePassword(credentialsId: 'e3bddfaa-07ac-42b3-a090-d838a8f386a6', usernameVariable: 'bitnami', passwordVariable: 'jbBD1968*bitnami')])
                {
                    sh "make ECR_REPO_URI='743327341874.dkr.ecr.us-east-1.amazonaws.com/nextiva-aws-example-repository'"
                }
            }
        }
    }
}