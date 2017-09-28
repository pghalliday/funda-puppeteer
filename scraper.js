const path = require('path');
const _ = require('lodash');
const winston = require('winston');
const Browser = require('./util/browser');
const range = require('./util/range');
const getList = require('./list');
const getResult = require('./result');

const RESULT_DELAY = 5000;

const BASE_URL = 'https://www.funda.nl';

const FOR_SALE_PATH = '/en/koop';
const FOR_RENT_PATH = '/en/huur';
const NEW_BUILDS_PATH = '/en/nieuwbouw';
const SOLD_FILTER = '/en/verkocht';
const RENTED_FILTER = '/en/verhuurd';

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

    const getResults = hrefs => {
      return Promise.all(hrefs.map(href => getResult(this.browser, `${BASE_URL}${href}`)));
    };

    const getListUrl = pageNumber => {
      return `${BASE_URL}${FOR_SALE_PATH}/${this.place}/p${pageNumber}/`;
    };
    const filter = `${FOR_SALE_PATH}/${this.place}`;

    const getPageResults = async pageNumber => {
      const list = await getList(this.browser, getListUrl(pageNumber), filter);
      return getResults(list.hrefs);
    };

    const list = await getList(this.browser, getListUrl(1), filter);

    winston.log('info', `Scraping ${list.pageCount} pages of results`);

    let promises = [getResults(list.hrefs)];
    if (list.pageCount) {
      const pageCountInt = parseInt(list.pageCount);
      if (pageCountInt > 1) {
        const pages = range(2, pageCountInt);
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
