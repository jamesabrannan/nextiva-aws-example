def JENKINS_WORKSPACE_SCRIPT_NAME = "test-aws-chime"

pipeline {
    agent any
    stages {
        stage('Initialize Project') 
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
        stage('Create Resources') 
        {
            steps {
                script
                {
                    try {
                        sh "make create_ecr_repository"
                    }
                    catch(err){
                        echo 'could not run makefile create_ecr_repository task'
                        echo ${err}
                        currentBuild.result = 'FAILURE'
                    }
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
    }
}
  