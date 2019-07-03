'use strict'

const chromium = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')
const AWS = require('aws-sdk')
const s3 = new AWS.s3()

const HASH_HEADER_NAME = 'x-amz-html-hash' // must start with x-amz
const TIMEOUT = 30000 // in milliseconds
// To configure, refer to:
// https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagepdfoptions
const PDF_OPTIONS = {
    printBackground: true,
    format: 'A4',
    displayHeaderFooter: false,
    height: '594mm',        // allowed units: mm, cm, in, px
    width: '420mm',
    margin: {
        right: '100px', // default is 0, units: mm, cm, in, px
        left: '100px',
        top: '80px',
        bottom: '80px'
    }
}

console.log('Loading handler function');

const respondWith = (code, headers, responseBody) => {
    // The response must be formatted as such or else 502 will be returned
    const response = {
        statusCode: code,
        headers: headers,
        body: JSON.stringify(responseBody),
        isBase64Encoded: false
    }
    console.log("response: " + JSON.stringify(response))
    return response
}
 
exports.handler = async (event) => {

    console.log("request: " + JSON.stringify(event))
    if (event.httpMethod !== 'POST') {
        return respondWith(405, {}, 'Only POST supported')
    }
    if (!event.body) {
        return responseWith(400, {}, 'Missing body')
    }
    const body = JSON.parse(event.body)
    if (!body.serializedHTML || 
        !body.serializedHTMLName ||
        !body.serializedHTMLHash ||
        !body.bucketName) {
        return respondWith(400, {}, 'Body does not contain required content')
    }

    const pupeeteerOptions = {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
    }
    let browser = null
    let pdfbase64 = null
    // Generate the PDF with pupeeteer
    try {
        browser = await puppeteer.launch(pupeeteerOptions)
        const page = await browser.newPage()

        // External resources must be present in assets folder or outside
        await page.setRequestInterception(true);
        page.on('request', request => {
            if (!request.url().startsWith('./assets') && !request.url().startsWith('http')) {
                request.abort()
            } else {
                request.continue()
            }
        })

        // Set HTML
        await page.setContent(body.serializedHTML, {
            timeout: TIMEOUT,
            waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
        })

        // Apply the CSS manually
        //await page.addStyleTag({ path: 'createpdf/assets/styles/normalize.css' })
        //await page.addStyleTag({ path: 'createpdf/assets/styles/main.css' })

        const pdf = await page.pdf(PDF_OPTIONS)

        // Do not use callbacks on AWS Lambda w/ Node 8
        pdfbase64 = pdf.toString('base64')
    } catch (error) {
        return respondWith(500, {}, error)
    }
    if (browser !== null) {
        await browser.close()
    }

    if (!pdfbase64) {
        return respondWith(500, {}, 'Uncaught error before upload. The PDF was not successfully generated')
    }

    // Then upload the PDF to s3
    const uploadParams = {
        'Bucket': body.bucketName,
        'Key': body.serializedHTMLName,
        'Metadata': {
            [HASH_HEADER_NAME]: body.serializedHTMLHash
        },
        'Body': pdfbase64
    }
    s3.upload(uploadParams, function(err, data) {
        if (err) {
            return respondWith(500, {}, 'Upload error:' + err)
        }
        if (data) {
            return respondWith(200, {}, 'Completed successfully')
        }
        return responseWith(500, {}, 'Uncaught error at upload')
    })
}