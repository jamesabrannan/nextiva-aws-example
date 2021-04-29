def JENKINS_WORKSPACE_SCRIPT_NAME = "test-aws-chime"
def ECR_REPOSITORY_NAME = "test-chime-recording-repository"

pipeline {
    agent any
    stages {
        stage('Ensure AWS Resources') 
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
                    try {
                        def ecr_created = sh "make get_ecr_repository"
                        echo '${ecr_created}'
                        def jsonAsg = readJSON text: ecr_created 
                        def arn = jsonAsg.repositories[0].repositoryArn
                        echo 'arn:${arn}'
                    }
                    catch(err){
                        echo 'could not obtain ecr repository'
                        echo $(err)
                        currentBuild.result = 'FAILURE'
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
                    echo "nothing yet"
                }
            }
        }   
    }
}
  