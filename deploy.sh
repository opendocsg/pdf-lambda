#!/bin/bash
set -ev
npm install
zip -r -q code.zip .
OUTPUT=$(aws lambda update-function-code --function-name create_pdf_2 --zip-file fileb://code.zip --publish)
VERSION=$(echo $OUTPUT | grep -Po '"Version":.*?[^\\]",' | grep -Po "\d*")
if [ $TRAVIS_BRANCH == 'dev' ]; then
  aws lambda update-alias --function-name create_pdf_2 --name dev --function-version $VERSION
  echo 'Latest Lambda aliased to dev';
elif [ $TRAVIS_BRANCH == 'prod' ]; then
  aws lambda update-alias --function-name create_pdf_2 --name prod --function-version $VERSION
  echo 'Latest Lambda aliased to prod';
fi
