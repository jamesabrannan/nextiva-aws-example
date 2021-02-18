pipeline {
    agent any
    stages {
        stage('Submit Stack') {
            steps {
             sh "whoami"
            //sh "aws cloudformation create-stack --stack-name s3bucket --template-body file://simplests3cft.json --region 'us-east-1'"
            sh "make ECR_REPO_URI='743327341874.dkr.ecr.us-east-1.amazonaws.com/nextiva-aws-example-repository'"
            }
             }
            }
            }