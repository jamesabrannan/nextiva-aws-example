pipeline {
    agent any
    tools {nodejs "node"}

    stages {
        stage('Create-Docker-Deploy-ECR') {
            steps {
                //run the script to create Docker Container and deploy in ECR repository
                //this is a makefile that combines docker and aws install of container
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: 'nextiva-aws-jenkins-user', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) 
                {
                  aws ecr get-login-password --region $(REGION) | docker login --username AWS --password-stdin $(ECR_REPO_URI)
                }
            }
        }
    }
}