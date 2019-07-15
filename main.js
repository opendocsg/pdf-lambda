'use strict'

const chromium = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')
const fs = require('fs')
const AWS = require('aws-sdk')
const s3 = new AWS.S3()

const HASH_HEADER_NAME = 'html-hash' // Once uploaded, this will be prepended with x-amz-meta-
const TEMP_PDF_FILEPATH = '/tmp/temp.pdf' // On Lambda, writes can only be done in /tmp
const TIMEOUT = 30000 // in milliseconds

// To configure, refer to:
// https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagepdfoptions
const PDF_OPTIONS = {
    path: TEMP_PDF_FILEPATH,
    printBackground: true,
    format: 'A4',
    displayHeaderFooter: false,
    margin: {
        right: '100px', // default is 0, units: mm, cm, in, px
        left: '100px',
        top: '80px',
        bottom: '80px'
    },
}

const respondWith = (code, headers, responseBody) => {
    // The response must be formatted as such or else 502 will be returned
    const response = {
        "statusCode": code,
        "headers": headers,
        "body": JSON.stringify(responseBody),
        "isBase64Encoded": false
    }
    return response
}
 
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return respondWith(405, {}, 'Only POST supported')
    }
    if (!event.body) {
        return respondWith(400, {}, 'Missing body')
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
    // Generate the PDF with pupeeteer
    try {
        browser = await puppeteer.launch(pupeeteerOptions)
        const page = await browser.newPage()

        // Set HTML
        await page.setContent(body.serializedHTML, {
            timeout: TIMEOUT,
            waitUntil: ['load']
        })

        await page.evaluate(async () => {
            const selectors = Array.from(document.querySelectorAll("img"));
            await Promise.all(selectors.map(img => {
              if (img.complete) return;
              return new Promise((resolve, reject) => {
                img.addEventListener('load', resolve);
                img.addEventListener('error', reject);
              });
            }));
          })

        await page.pdf(PDF_OPTIONS)
    } catch (error) {
        return respondWith(500, {}, error)
    }
    if (browser !== null) {
        await browser.close()
    }

    const pdfBin = fs.readFileSync(TEMP_PDF_FILEPATH)

    // Then upload the PDF to s3
    const uploadParams = {
        'Bucket': body.bucketName,
        'ACL': 'public-read',
        'Key': body.serializedHTMLName,
        'Metadata': {
            [HASH_HEADER_NAME]: body.serializedHTMLHash
        },
        'Body': pdfBin
    }
    const uploadPromise = new Promise(function(resolve, reject) {
        s3.upload(uploadParams, function(err, data) {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
    const res = await uploadPromise
    const amz_HASH_HEADER_NAME = 'x-amz-meta-' + HASH_HEADER_NAME
    if (res.ETag) {
        return respondWith(200, {}, {...res, [amz_HASH_HEADER_NAME]:body.serializedHTMLHash})
    } else {
        return respondWith(500, {}, res)
    }
}