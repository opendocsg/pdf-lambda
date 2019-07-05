#!/bin/bash
set -e
DATE=$(date)
BUCKET_NAME='opendoc-theme-pdf'
if [[ -z "${LAMBDA_API_KEY}" ]]; then
  echo "Missing environment variable LAMBDA_API_KEY; exiting.";
  exit
fi
curl -X POST \
  'https://4c08rjv4pa.execute-api.ap-southeast-1.amazonaws.com/prod/create_pdf_2' \
  -H "content-type: application/json" \
  -H "x-api-key: ${LAMBDA_API_KEY}" \
  -d '{ "serializedHTML":"<!DOCTYPE html><p>If you are seeing this, the PDF was generated successfully at '"$DATE"'. Awesome!</p>","serializedHTMLName":"hello.pdf","serializedHTMLHash":"ZmJlZTVkYzRiNDNmYmUyYzNhNWM5OGFlODc4ZDJjNmM=","bucketName":"'$BUCKET_NAME'"}'

echo -e "\n\nCheck for hello.pdf at https://$BUCKET_NAME.s3-ap-southeast-1.amazonaws.com/hello.pdf"
