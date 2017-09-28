const winston = require('winston');
const puppeteer = require('puppeteer');
const wait = require('./wait');

const DEFAULT_MAX_CONCURRENT_PAGES = 16;
const DEFAULT_PAGE_DELAY = 0;
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36';

module.exports = class Browser {
  constructor(maxConcurrentPages = DEFAULT_MAX_CONCURRENT_PAGES, userAgent = DEFAULT_USER_AGENT) {
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
    winston.log('info', `Loading page with URL: ${url}`);
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

  async openPage(url, delay = DEFAULT_PAGE_DELAY) {
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
      winston.log('info', `Closing page with URL: ${page.url()}`);
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
    this.pageCount = 0;
    this.pages = [];
    this.queue = [];
    this.browser.close();
  }
}
