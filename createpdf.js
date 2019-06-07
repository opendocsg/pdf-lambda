const chromium = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')

const TIMEOUT = 10000 // in milliseconds
const UNDEF_MSG = 'This is a blank page.' // message if HTML cannot be found

// To configure, refer to:
// https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagepdfoptions
const OPTIONS = {
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

exports.createpdf = async (event, context, callback) => {
    const html = event.serializedDom !== undefined ? 
        event.serializedDom : 
        `<!DOCTYPE html><html>${ UNDEF_MSG }</html>`

    const options = {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
    }
    let browser = null
    try {
        browser = await puppeteer.launch(options)
        const page = await browser.newPage()
        await page.setContent(html, {
            timeout: TIMEOUT,
            waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
        })

        // Apply the CSS manually
        await page.addStyleTag({path: 'createpdf/assets/styles/normalize.css'})
        await page.addStyleTag({path: 'createpdf/assets/styles/main.css'})

        const pdf = await page.pdf(OPTIONS)

        // Do not use callbacks on AWS Lambda w/ Node 8
        return pdf.toString('base64')
    } catch (error) {
        throw new Error('Error: ' + error)
    } finally {
        if (browser !== null) {
            await browser.close()
        }
    }
}
