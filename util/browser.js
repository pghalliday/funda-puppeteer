const winston = require('winston');
const puppeteer = require('puppeteer');
const wait = require('./wait').wait;

const DEFAULTS = {
  MAX_CONCURRENT_PAGES: 16,
  DELAY: 0,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36',
};
module.exports.DEFAULTS = DEFAULTS;

module.exports.Browser = class {
  constructor({maxConcurrentPages = DEFAULTS.MAX_CONCURRENT_PAGES, userAgent = DEFAULTS.USER_AGENT}) {
    this.maxConcurrentPages = maxConcurrentPages;
    this.userAgent = userAgent;
  }

  async init() {
    this.pageCount = 0;
    this.pages = [];
    this.queue = [];
    this.browser = await puppeteer.launch();
  }

  async _open(url, delay) {
    winston.log('debug', `Loading page with URL: ${url}`);
    // up the count first to avoid a race condition that could
    // result in more than the max pages being opened
    this.pageCount++;
    const page = await this.browser.newPage();
    // record the actual page so we can check when the page is closed
    // if it is still open
    this.pages.push(page);
    await page.setUserAgent(this.userAgent);
    await page.goto(url);
    await wait(delay);
    return page;
  }

  async openPage(url, delay = DEFAULTS.PAGE_DELAY) {
    if (this.pageCount < this.maxConcurrentPages) {
      return this._open(url, delay);
    } else {
      return new Promise(resolve => {
        this.queue.push(async () => {
          const page = await this._open(url, delay);
          resolve(page);
        });
      });
    }
  }
  
  async closePage(page) {
    const index = this.pages.indexOf(page);
    if (index !== -1) {
      winston.log('debug', `Closing page with URL: ${page.url()}`);
      this.pages.splice(index, 1);
      await page.close();
      this.pageCount--;
      if (this.queue.length > 0) {
        // don't need to wait for this as it
        // doesn't return anything and the queue
        // is controlled by the counter
        this.queue.shift()();
      }
    }
  }

  close() {
    // This closes all the pages so we can
    // reset the pageCount, etc. This prevents
    // errors from asynchronous calls to closePage
    // that may not have happened yet
    winston.log('debug', 'Closing the browser');
    this.pageCount = 0;
    this.pages = [];
    this.queue = [];
    this.browser.close();
  }
}
