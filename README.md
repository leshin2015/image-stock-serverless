# AWS practice one

## Introduction
- The practical to build a image stock system using AWS services.
- You can find all relative documents at the [link](https://drive.google.com/drive/folders/1nvr4K8LT2UmXeqtIvYFi2G5AzsATtLMO).

## Table of contents
- [Technical stack](#technical-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project structure](#project-structure)
- [Stay in touch](#stay-in-touch)

## Technical stack
[**CloudFormation**](https://aws.amazon.com/cloudformation/)

- Use Infrastructure-as-Code for all cloud resources to make it easy to roll this out to multiple environments.

[**API Gateway**](https://aws.amazon.com/api-gateway/)

- RESTful API which send requests to lambda function.

[**Lambda**](https://aws.amazon.com/lambda/)

- AWS Lambda is an event-driven, serverless computing platform that executes your code in response to events. It manages the underlying infrastructure scaling it up or down to meet the event rate.

[**S3**](https://aws.amazon.com/s3/)

- Storage services contain: CloudFormation templates and Lambda functions code

[**DynamoDB**](https://aws.amazon.com/dynamodb/)

- Service helps persisting data.

[**CloudWatch**](https://aws.amazon.com/cloudwatch/)

- Service helps to collect all the getting logs of lambda, API Gateway and DynamoDB.

[**Cognito**](https://aws.amazon.com/cognito/)

- Service helps you add user sign-up, sign-in, and access control to your web and mobile apps quickly and easily.

[**SQS**](https://aws.amazon.com/sqs/)

- Service helps you managed message queuing.

## Prerequisites
- [Node 12+](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/)
- [AWS CLI](https://aws.amazon.com/cli/)

## Installation
This section describe the setup environment steps for developer can start app and develop:
1. First of all, please create a S3 source bucket for all lambda function dependencies and update the ENV for bucket name in file activate.sh

2. Activate the bash script to run any helper command line:
    ```bash
    $ source activate.sh
    # Note: Make sure develop install all prerequisites tools that are informed after activating the bash script.
    ```

3. To prepare all lambda function dependencies, please run:
    ```bash
    $ do-pre-package-cfn
    ```

4. To validate CloudFormation template, please run:
    ```bash
    $ do-validate-cfn your-template-dir
    # For example: $do-validate-cfn cfn-templates/main.yml
    ```

5. To package CloudFormation template, please run:
    ```bash
    $ do-package-cfn
    ```

## Project structure
* **cfn-template**: includes all the template file for CloudFormation stack.
    * **modules**: provides nested stack for the main stack.
    * **main.yml**: define CFN template for the main stack of the system.

* **lambda**: includes all the lambda function and its dependencies.
* **dist**: includes all the generated lambda function and its dependencies as zip file to put to the S3 source bucket.

## Stay in touch
- Author - [Trung Nguyen Trong](https://gitlab.asoft-python.com/trung.nguyentrong)