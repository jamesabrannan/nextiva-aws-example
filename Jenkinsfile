pipeline {
    agent any
    tools {nodejs "node"
        stages {
            stage('Create-Docker-Deploy-ECR') {
                steps {
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