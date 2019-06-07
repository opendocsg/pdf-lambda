# `create_pdf` Lambda function
Allows an authorized user to generate a PDF from [serialized HTML](https://github.com/jsdom/jsdom#serializing-the-document-with-serialize).
#### Resource URL `create_pdf`: https://9lt0883lre.execute-api.ap-southeast-1.amazonaws.com/default/create_pdf
Requires: <50MB (AWS Lambda limit)
## How it works
1. The Opendoc Netlify build process makes a POST request to `create_pdf` with the serialized HTML as the body, formatted as such
```
POST https://9lt0883lre.execute-api.ap-southeast-1.amazonaws.com/default/create_pdf
Headers:
'x-api-key':<API KEY HERE> e.g. '123abc...'

Body(JSON):
{
   'serializedDom':  <serialized HTML here> e.g. '<!DOCTYPE html><html> Hello world ...</html>'
}
```
2. Before `create_pdf` is initialised, the POST request is first validated by the AWS API Gateway:  
 - Headers is checked for a valid 'x-api-key'. If not, `403 Forbidden` will be returned.
 - Body is checked for key 'serializeDom'. If not, `400 Bad Request` will be returned.
 - Note: If the wrong HTTP method OR URL is used, a `Missing Authentication Token` message will be returned.

3. The Lambda function is now initialized. `create_pdf` spins up an instance of [puppeteer](https://github.com/GoogleChrome/puppeteer) (a headless Chrome API), which itself spins up an instance of [Chrome-AWS-Lambda](https://github.com/alixaxel/chrome-aws-lambda) (a lightweight Chromium binary).
4. `create_pdf` reads the serialized HTML and applies CSS. If no HTML was detected, the pdf will contain only the predefined blank page message.
5. The PDF is generated and returned as a base64 encoded string.
6. On the receiving end, the data is read into a Buffer with base64 encoding and written to file.

## How to modify
1. Make the modification.
2. Zip the `create_pdf` folder. This is our AWS Lambda Deployment package, which includes the code and all its dependencies.
 - Note: AWS imposes a hard [limit](https://docs.aws.amazon.com/lambda/latest/dg/limits.html) of 50MB for zipped deployment packages. This is the reason Chrome-Aws-Lambda is used instead of the full Chromium Binary.
3. Go to the AWS Lambda Management Console for `create_pdf`. Under `Function code`, select:  
 - Code entry type: Upload a .zip file
 - Runtime: NodeJs 8.10 (because Chrome-Aws-Lambda does not support NodeJS 10.x)
 - Handler: createpdf.createpdf
4. In the same panel, click upload. Select your `create_pdf.zip`.

## Troubleshooting
 - Ensure that memory allocated to `create_pdf` is at least 512MB.
 - Ensure that timeout is at least 15 seconds.
 - If AWS API Gateway (different from AWS Lambda Management Console) settings were modified, ensure that the API has been re-deployed.