def JENKINS_WORKSPACE_SCRIPT_NAME = "test-aws-chime"
def MAKE_STAGE = "init"

pipeline {
    agent any
    stages {
        stage('Build Project') 
        {
            steps {
                script
                {
                    try {
                        sh "make ${STAGE}"
                    }
                    catch(err){
                        echo 'could not run makefile'
                        echo ${err}
                        currentBuild.result = 'FAILURE'
                    }
                }
            }
        }
    }
}
  