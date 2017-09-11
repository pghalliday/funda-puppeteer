const puppeteer = require('puppeteer');

const wait = (delay) => new Promise((resolve) => {
  setTimeout(() => {
    resolve();
  }, delay);
});

(async () => {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36');
    await page.goto('https://www.funda.nl/koop/1015sz/+1km/p1/');
    await wait(5000);
    const text = await page.plainText();
    console.log(text);
  } catch (e) {
    console.log(e);
  }
  browser.close();
})();
