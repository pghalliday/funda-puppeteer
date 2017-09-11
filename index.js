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
    await page.goto('https://www.funda.nl/koop/1015sz/+1km/');
    await wait(5000);
    const pageLinks = await page.$$('div.pagination-pages > a');
    const lastPageLink = pageLinks[pageLinks.length - 1];
    const pageMax = await lastPageLink.evaluate(link => link.getAttribute('data-pagination-page'));
    console.log(pageMax);
    const resultLinks = await page.$$('div.search-result-media > a');
    for (let resultLink of resultLinks) {
      const href = await resultLink.evaluate(link => link.getAttribute('href'));
      console.log(href);
    }
  } catch (e) {
    console.log(e);
  }
  browser.close();
})();
