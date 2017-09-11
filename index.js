const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    const response = await page.goto('https://www.funda.nl/koop/1015sz/+1km/p1/');
    const body = await response.text();
    console.log(body);
  } catch (e) {
    console.log(e);
  }
  browser.close();
})();
