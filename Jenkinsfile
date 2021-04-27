

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
                echo 'could not run makefile'
                echo ${err}
                currentBuild.result = 'FAILURE'
            }
                }
        }
    }
  