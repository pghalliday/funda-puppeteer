const path = require('path');
const winston = require('winston');
const Browser = require('./browser');
const range = require('./range');

const LIST_DELAY = 5000;
const RESULT_DELAY = 5000;

const BASE_URL = 'https://www.funda.nl';

const FOR_SALE_PATH = '/koop';
const FOR_RENT_PATH = '/huur';
const NEW_BUILDS_PATH = '/nieuwbouw';
const SOLD_FILTER = '/verkocht';
const RENTED_FILTER = '/verhuurd';

module.exports = class Scraper {
  constructor(place, outputdir) {
    winston.log('info', `Scraping data for ${place}`);
    this.place = place;
    this.outputdir = path.join(path.resolve(outputdir), this.place, (new Date()).toISOString());
    winston.log('info', `Generating ouput in: ${this.outputdir}`);
    this.browser = new Browser();
  }

  async run() {
    winston.log('info', 'Starting');
    await this.browser.init();
    await Promise.all([
      this._forSale(),
      this._forRent(),
      this._sold(),
      this._rented(),
      this._newBuilds(),
    ]);
    this.browser.close();
  }

  async _forSale() {
    winston.log('info', 'Scraping properties for sale');

    const createResult = async page => {
      const detailDiv = await page.$('div.object-detail');
      const id = await detailDiv.evaluate(element => element.getAttribute('data-interaction-tinyid'));
      const titleElement = await page.$('h1.object-header-title');
      const address = await titleElement.evaluate(element => element.textContent);
      const url = page.url();
      await this.browser.closePage(page);
      const result = {
        id,
        address,
        url,
      };
      winston.log('info', result);
      return result;
    }

    const getResults = async page => {
      const resultLinks = await page.$$('div.search-result-media > a');
      return Promise.all(resultLinks.map(resultLink => {
        return resultLink.evaluate(link => link.getAttribute('href'));
      })).then(hrefs => {
        // we have all the hrefs so we can close the list page,
        // this should prevent a dead lock when there are many list pages
        this.browser.closePage(page);
        // filter invalid links and get the result pages
        return Promise.all(hrefs.filter(href => href.startsWith(`${FOR_SALE_PATH}/${this.place}`)).map(async href => {
          const resultPage = await this.browser.openPage(`${BASE_URL}${href}`, RESULT_DELAY);
          return createResult(resultPage);
        }));
      });
    };

    const getListPage = pageNumber => {
      return this.browser.openPage(`${BASE_URL}${FOR_SALE_PATH}/${this.place}/p${pageNumber}/`, LIST_DELAY);
    };

    const getPageResults = async pageNumber => {
      const page = await getListPage(pageNumber);
      return getResults(page);
    };

    const page = await getListPage(1);
    const pageLinks = await page.$$('div.pagination-pages > a');
    const lastPageLink = pageLinks[pageLinks.length - 1];
    const pageMax = await lastPageLink.evaluate(link => link.getAttribute('data-pagination-page'));

    winston.log('info', `Scraping ${pageMax} pages of results`);

    let promises = [getResults(page)];
    if (pageMax) {
      const pageMaxInt = parseInt(pageMax);
      if (pageMaxInt > 1) {
        const pages = range(2, pageMaxInt);
        promises = promises.concat(pages.map(pageNumber => getPageResults(pageNumber)));
      }
    }

    const resultArrays = await Promise.all(promises);
    const results = [].concat(...resultArrays);

    winston.log('info', results.length);
  }

  async _forRent() {
  }

  async _sold() {
  }

  async _rented() {
  }

  async _newBuilds() {
  }
}
