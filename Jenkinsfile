pipeline {
    agent any
        stages {
            stage('Create-Docker-Deploy-ECR') {
                steps {
                    // need to do this cause can't figure out docker chmod 777 /var/run/docker.sock"
                    sh "make ECR_REPO_URI='743327341874.dkr.ecr.us-east-1.amazonaws.com/nextiva-aws-example-repository'"
                }
            }
    }
}