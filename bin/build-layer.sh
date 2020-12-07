#!/bin/bash
set -eo pipefail

current_dir=$PWD
lambda_dir=$current_dir/../lambda

# Build dependencies layer for image handler function
image_handler=$lambda_dir/image-handler
cd $image_handler
mkdir -p lib/nodejs
rm -rf node_modules lib/nodejs/node_modules
npm install --arch=x64 --platform=linux --only=production
mv node_modules lib/nodejs/

# Build dependencies layer for send image function
send_image=$lambda_dir/send-image
cd $send_image
mkdir -p lib/nodejs
rm -rf node_modules lib/nodejs/node_modules
npm install --arch=x64 --platform=linux --only=production
mv node_modules lib/nodejs/