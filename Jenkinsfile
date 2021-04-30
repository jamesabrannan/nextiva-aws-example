def JENKINS_WORKSPACE_SCRIPT_NAME = "test-aws-chime"
def ECR_REPOSITORY_NAME = "test-chime-recording-repository"
def ecr_arn = ""
def DOCKER_TAG = "latest"

pipeline {
    agent any
    stages {
    /*    stage('Ensure AWS Resources') 
        {
            steps {
                script
                {
                    try {
                        sh "make init"
                    }
                    catch(err){
                        echo 'could not run makefile init task'
                        echo ${err}
                        currentBuild.result = 'FAILURE'
                    }
                }
            }
        }
        stage('Create Elastic Container Registry') 
        {
            steps {
                script
                {
                    try {
                        sh "make create_ecr_repository"
                    }
                    catch(err){
                        echo ${err}
                    }
                }
            }
        }
        stage('Create and Configure S3 Buckets') 
        {
            steps {
                script
                {
                    try {
                        sh "make create_configure_buckets"
                    }
                    catch(err){
                        echo 'could not run makefile create_configure_buckets task'
                        echo ${err}
                        currentBuild.result = 'FAILURE'
                    }
                }
            }
        }
        stage('Create and Deploy Docker ECR')
        {
            steps {
                script
                {
                    sh "make build_image"
                }
            }
        }
        stage('Deploy CloudFormation Resources')
        {
            steps {
                script
                {
                    sh "make deploy"
                }
            }
        }   */
        stage('Setup AutoScaling')
        {
            steps {
                script
                {
                    sh "make setup_autoscaling"
                }
            }
        } 
    }
}
  