#!/bin/bash

# ##############################################################################
# This file contains all helpers, bootstrapping and testing functions for the
# project.
#
# How to use:
# $ source activate.sh
# ##############################################################################

# ------------------------------------------------------------------------------
# Global env variables
# ------------------------------------------------------------------------------
export PROJ_DIR='$( cd '$( dirname '${BASH_SOURCE[0]}' )' && pwd )';
export PROJ_NAME='practice-one';
export DIST_DIR='dist';
export S3_SRC_BUCKET='testing-auto-deploy-src';
export S3_NESTED_STACK_BUCKET='test-nested-stack-cfn-iddt';

# Go back to home directory
function do-home {
    cd ${PROJ_DIR} &> /dev/null
}

function do-pre-package-cfn() {
    mkdir -p ${PROJ_DIR}/${DIST_DIR}/get-image
    mkdir -p ${PROJ_DIR}/${DIST_DIR}/send-image
    mkdir -p ${PROJ_DIR}/${DIST_DIR}/post-confirmation-trigger
    mkdir -p ${PROJ_DIR}/${DIST_DIR}/image-handler

    do-build-image-handler
    do-build-send-image
    do-build-get-image
    do-build-post-confirmation

    aws s3 cp ${PROJ_DIR}/${DIST_DIR}/ s3://${S3_SRC_BUCKET}/ –recursive
}

function do-validate-cfn() {
    do-home
    aws cloudformation validate-template --template-body file://$1
}

function do-package-cfn() {
    if [ ! -d '$PROJ_DIR/$DIST_DIR' ]
    then
        mkdir -p ${PROJ_DIR}/${DIST_DIR}
    fi

    aws cloudformation package --template-file cfn-templates/main.yml --output-template ${PROJ_DIR}/${DIST_DIR}/packaged.yml --s3-bucket ${S3_NESTED_STACK_BUCKET} --region us-east-1
}

function do-build-layer() {
    cd ${PROJ_DIR}/lambda/$1
    mkdir -p nodejs
    rm -rf node_modules nodejs/node_modules
    npm install --arch=x64 --platform=linux --only=production
    mv node_modules nodejs/
    zip -r lib.zip nodejs
    rm -rf ${PROJ_DIR}/${DIST_DIR}/$1/lib.zip
    mv lib.zip ${PROJ_DIR}/${DIST_DIR}/$1/
}

function do-build-function() {
    cd ${PROJ_DIR}/lambda/$1
    zip -r function.zip function
    rm -rf ${PROJ_DIR}/${DIST_DIR}/$1/function.zip
    mv function.zip ${PROJ_DIR}/${DIST_DIR}/$1/
}

function do-build-image-handler() {
    do-build-layer image-handler
    do-build-function image-handler
}

function do-build-send-image() {
    do-build-layer send-image
    do-build-function send-image
}

function do-build-get-image() {
    do-build-layer get-image
    do-build-function get-image
}

function do-build-post-confirmation() {
    do-build-layer post-confirmation-trigger
    do-build-function post-confirmation-trigger
}

# Check cmd is available
# Eg for make sure git is available, you can run:
# $ _do-cmd-assert 'git'
function _do-cmd-assert {
    local cmd
    local fail=()
    for cmd in $@; do
        which $cmd &> /dev/null
        if [[ "$?" == "1" ]]; then
            fail+=( "${cmd}" )
        fi
    done

    if [[ ${#fail[@]} -gt 0 ]]; then
        _do_print_warn "WARN: Expects ${fail[@]} command(s) to be installed."
    fi
}

_do-cmd-assert aws