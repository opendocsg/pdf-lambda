#!/bin/bash
set -ev
npm install
zip -r -q code.zip .
aws lambda update-function-code --function-name create_pdf_2 --zip-file fileb://code.zip --publish
