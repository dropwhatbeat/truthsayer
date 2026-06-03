import puppeteer, { Browser, Page } from 'puppeteer'

let browser: Browser | null = null

export async function ensureBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    const headed = process.env.HEADED === 'true'
    browser = await puppeteer.launch({
      headless: !headed,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }
  return browser
}

export function getBrowser(): Browser {
  if (!browser || !browser.isConnected()) {
    throw new Error(
      'Browser not initialized. Call ensureBrowser() first.'
    )
  }
  return browser
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close()
    browser = null
  }
}
