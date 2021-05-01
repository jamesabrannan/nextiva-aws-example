// ===================================================================
// Copyright (c) 2020 Nextiva, Inc. to Present.
// All rights reserved.
//
//
// Jenkins Pipeline script for building recording application on AWS
// uses Makefile to perform steps to create AWS resources.
//
// Dependencies:
//  AWS Credentials visible by Jenkins in ~/.aws
//  Docker
//  make
//  jq
// ====================================================================


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
                        //note: do not catch the error, continue
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
        }   
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
  