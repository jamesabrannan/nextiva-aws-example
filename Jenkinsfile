pipeline {
    agent any
        stages {
            stage('Create-Docker-Deploy-ECR') {
                steps {
                    // need to do this cause can't figure out docker chmod 777 /var/run/docker.sock"
                    sh "aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 743327341874.dkr.ecr.us-east-1.amazonaws.com/nextiva-aws-example-repository"
                    sh "docker build -t nextiva-aws-example-repository ."
                    sh "docker tag nextiva-aws-example-repository:latest 743327341874.dkr.ecr.us-east-1.amazonaws.com/nextiva-aws-example-repository:latest"
                    sh "docker push 743327341874.dkr.ecr.us-east-1.amazonaws.com/nextiva-aws-example-repository:latest"
                }
            }
            stage('Build CloudFormation Stack'){
                steps {
                    sh "node ./deploy.js -b recording-demo-james123-deploy-bucket -s recording-demo-cnf-stack -i 743327341874.dkr.ecr.us-east-1.amazonaws.com/nextiva-aws-example-repository:latest -r us-east-1"
                }
            }
    }
}