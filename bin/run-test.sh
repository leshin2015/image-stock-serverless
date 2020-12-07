#!/bin/bash
set -eo pipefail

current_dir=$PWD
lambda_dir=$current_dir/../lambda

# Run lambda unit test for image handler function
image_handler=$lambda_dir/image-handler
cd $image_handler
npm test

# Run lambda unit test for send image function
send_image=$lambda_dir/send-image
cd $send_image
npm test

# curl -X POST https://lvctmt9a9d.execute-api.us-east-1.amazonaws.com/dev/images -H "Content-Type: application/json" -d '{"image" : "'"$( base64 ~/Desktop/training/aws-training/practice-one/lambda/image-handler/test/images/test.jpg)"'", "format":"jpg", "imageName":"testing", "width":"900", "height":"420"}'
# curl -X GET https://lvctmt9a9d.execute-api.us-east-1.amazonaws.com/dev/images?imageId=a11b3235-fcb3-4b71-a232-d6a89551a04f&size=large -H "Content-Type: application/json"