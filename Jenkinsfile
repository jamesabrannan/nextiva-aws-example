pipeline {
    agent any
        stages {
            stage('Create-Docker-Deploy-ECR') {
                steps {
                    // need to do this cause can't figure out docker chmod 777 /var/run/docker.sock"
                    sh "docker run hello-world"
                }
            }
    }
}