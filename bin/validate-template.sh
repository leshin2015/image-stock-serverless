#!/bin/bash
set -eo pipefail

cd ..
aws cloudformation validate-template --template-body file://cfn-templates/main.yml
# aws cloudformation package --template-file cfn-templates/main.yml --output-template packaged.yml --s3-bucket test-nested-stack-cfn-iddt --region us-east-1