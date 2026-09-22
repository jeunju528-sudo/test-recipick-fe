pipeline {
    agent any

    environment {
        IMAGE = "jeunju528/recipick-fe:latest"
        EC2   = "ubuntu@3.39.22.236"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t $IMAGE .'
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub',
                    usernameVariable: 'DH_USER',
                    passwordVariable: 'DH_PASS'
                )]) {
                    sh '''
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                        docker push $IMAGE
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub',
                    usernameVariable: 'DOCKERHUB',
                    passwordVariable: 'DH_PASS'
                )]) {
                    sshagent(['ec2-ssh']) {
                        sh '''
                            ssh -o StrictHostKeyChecking=no $EC2 "
                                cd ~/recipick/deploy &&
                                DOCKERHUB='$DOCKERHUB' ./deploy.sh fe
                            "
                        '''
                    }
                }
            }
        }
    }

    post {
        success { echo '✅ FE 배포 성공' }
        failure { echo '❌ FE 배포 실패' }
    }
}