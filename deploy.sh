#!/bin/bash
# Required: set environment variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
# This script does:
# 1. zip, upload, and publish a new lambda version, say version=X
# 2. if dev/prod branch, alias dev/prod to version=X (not $LATEST which always points to latest)
set -ev
if [[ ($TRAVIS_BRANCH != 'dev') && ($TRAVIS_BRANCH != 'prod') ]]; then
  echo 'Not dev or prod branch; ignoring.'
  exit 0;
fi
npm install
zip -r -q code.zip .
OUTPUT=$(aws lambda update-function-code --function-name create_pdf_2 --zip-file fileb://code.zip --publish)
VERSION=$(echo $OUTPUT | grep -Po '"Version":.*?[^\\]",' | grep -Po "\d*")
if [[ $TRAVIS_BRANCH == 'dev' ]]; then
  aws lambda update-alias --function-name create_pdf_2 --name dev --function-version $VERSION
  echo 'Latest Lambda aliased to dev';
elif [[ $TRAVIS_BRANCH == 'prod' ]]; then
  aws lambda update-alias --function-name create_pdf_2 --name prod --function-version $VERSION
  echo 'Latest Lambda aliased to prod';
fi
