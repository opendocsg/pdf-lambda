# Create PDF
**Status of latest deployment from `prod` branch:** [![Build Status](https://travis-ci.com/opendocsg/pdf-lambda.svg?branch=prod)](https://travis-ci.com/opendocsg/pdf-lambda)
**Status of latest deployment from `dev` branch:** &nbsp;&nbsp;[![Build Status](https://travis-ci.com/opendocsg/pdf-lambda.svg?branch=dev)](https://travis-ci.com/opendocsg/pdf-lambda)  
(if the above is failing, it does not imply that the Lambda function is failing)  

## Overview
Turns [serialized HTML](https://github.com/jsdom/jsdom#serializing-the-document-with-serialize) into PDF, then pushes it onto S3.  
##### Prod URL https://4c08rjv4pa.execute-api.ap-southeast-1.amazonaws.com/prod/create_pdf_2
##### Dev URL https://4c08rjv4pa.execute-api.ap-southeast-1.amazonaws.com/dev/create_pdf_2

## API Call
1. Obtain an API key for create_pdf_2 from the AWS API Gateway > API Keys.
2. Make the call, shown below with `curl`. The headers (after -H) and JSON (after -d) shown below are required.
```bash
curl -X POST \
  '<URL>' \
  -H "x-api-key: <API KEY>" \
  -d '{ "serializedHTML":     "...",  #--> Will be rendered as PDF then stored as an S3 Object
        "serializedHTMLName": "...",  #--> Will be the S3 Object Key for the above object
        "serializedHTMLHash": "...",  #--> Will be stored as Object metadata. Will be sent in the headers in subsequent requests.
        "bucketName":"..." }'         #--> S3 Bucket
```

## How to develop
1. Make the modification.
2. Push to dev branch. Wait 1-2 minutes for it to deploy...
3. Test with `curl` as shown above. If unsatisfied, goto 1.
4. Else, push to prod branch.

## Troubleshooting
 - Ensure that memory allocated to `create_pdf` is at least 512MB.
 - If AWS API Gateway (different from AWS Lambda Management Console) settings were modified, ensure that the API has been re-deployed.
 - Ensure that the AWS API Gateway has permissions to access Lambda function, and that the Lambda function has permission to putObject and putObjectACL permissions to the S3 bucket.
