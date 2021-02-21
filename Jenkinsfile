pipeline {
    agent any
        stages {
            stage('Create-Docker-Deploy-ECR') {
                steps {
                    // need to do this cause can't figure out docker chmod 777 /var/run/docker.sock"
                   // sh "docker run hello-world"
                   // sh "aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com/recording-demo"
                  //  sh "docker build -t nextiva-aws-example-repository ."
                 //   sh "docker tag nextiva-aws-example-repository:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/recording-demo:latest"
                 //   sh "docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/recording-demo:latest"
                 sh "make ECR_REPO_URI='743327341874.dkr.ecr.us-east-1.amazonaws.com/nextiva-aws-example-repository'"
                }
            }
    }
}