# POST create_pdf
Allows an authorized user to generate a PDF from serialized HTML.
### Resource URL `create_pdf`: https://9lt0883lre.execute-api.ap-southeast-1.amazonaws.com/default/create_pdf

## How it works
1. The Opendoc Netlify build process makes a POST request to `create_pdf` with the serialized HTML as the body.
```
i.e. Headers: { 'x-api-key':'123abc...' }
Body: {
   'serializedDom':  '<!DOCTYPE html><html> Hello world ...</html>'
}
```
2. Before Lambda function is initialised, the POST request is first validated by AWS API Gateway:  
 - Headers must contain a valid 'x-api-key'. If not, `403 Forbidden` will be returned.
 - Body must contain JSON with key 'serializeDom'. If not, `400 Bad Request` will be returned.

3. The Lambda function is now initialized. `create_pdf` spins up an instance of puppeteer (a headless Chrome API), which itself spins up an instance of Chrome-AWS-Lambda (a lightweight Chromium binary).
4. `create_pdf` reads the serialized HTML and applies CSS. If no HTML was detected, the pdf will contain only the predefined blank page message.
5. The PDf is generated and returned as a base64 encoded string.

## How to modify
1. Make the modification.
2. Zip the `create_pdf` folder. This is our AWS Lambda Deployment package, which includes all of our code and its dependencies.
3. Go to the AWS Lambda Management Console for `create_pdf`. Under `Function code`, select:  
Code entry type: Upload a .zip file
Runtime: NodeJs 8.10
Handler: createpdf.createpdf
4. In the same panel, click upload. Select your `create_pdf.zip`.

## Troubleshooting
 - Ensure that memory allocated to `create_pdf` is at least 512MB.
 - Ensure that timeout is at least 15 seconds.
 - If AWS API Gateway (different from AWS Lambda Management Console) settings were modified, ensure that the API has been re-deployed.