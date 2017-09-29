const googleMaps = require('@google/maps');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const winston = require('winston');
const Browser = require('./util/browser');
const range = require('./util/range');
const getList = require('./list');
const getResult = require('./result');
const mkdirp = require('mkdirp');

const RESULT_DELAY = 5000;

const BASE_URL = 'https://www.funda.nl';

const FOR_SALE_PARAMS = {
  description: 'For Sale',
  urlPath: '/en/koop',
  filter: '',
  outputPath: 'for-sale',
};

const FOR_RENT_PARAMS = {
  description: 'For Rent',
  urlPath: '/en/huur',
  filter: '',
  outputPath: 'for-rent',
};

const SOLD_PARAMS = {
  description: 'Sold',
  urlPath: '/en/koop',
  filter: '/verkocht',
  outputPath: 'sold',
};

const RENTED_PARAMS = {
  description: 'Rented',
  urlPath: '/en/huur',
  filter: '/verhuurd',
  outputPath: 'rented',
};

module.exports = class Scraper {
  constructor(place, outputdir, googleApiKey) {
    winston.log('info', `Scraping data for ${place}`);
    this.place = place;
    this.outputdir = path.join(path.resolve(outputdir), this.place, (new Date()).toISOString());
    winston.log('info', `Generating output in: ${this.outputdir}`);
    mkdirp.sync(this.outputdir);
    this.browser = new Browser();
    if (googleApiKey) {
      this.googleMapsClient = googleMaps.createClient({
        key: googleApiKey,
      });
    } else {
      winston.log('info', `Skipping geocoding as no Google API Key provided`);
    }
  }

  async run() {
    winston.log('info', `Starting`);
    await this.browser.init();
    await Promise.all([
      this._collect(FOR_SALE_PARAMS),
      this._collect(FOR_RENT_PARAMS),
      this._collect(SOLD_PARAMS),
      this._collect(RENTED_PARAMS),
    ]);
    this.browser.close();
  }

  async _collect(params) {
    winston.log('info', `${params.description}: Scraping`);
    const outputdir = path.join(this.outputdir, params.outputPath);
    winston.log('info', `${params.description}: Generating output in: ${outputdir}`);
    mkdirp.sync(outputdir);

    const getResults = hrefs => {
      return Promise.all(hrefs.map(href => getResult(this.browser, `${BASE_URL}${href}`, this.googleMapsClient).then(result => {
        if (result) {
          return new Promise((resolve, reject) => {
            const out = path.join(outputdir, result.id);
            fs.writeFile(out, JSON.stringify(result, null, 2), err => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
        } else {
          const err = new Error(`Failed to load details for ${href}`);
          winston.log('warning', err);
          throw err;
        }
      })));
    };

    const getListUrl = pageNumber => {
      return `${BASE_URL}${params.urlPath}/${this.place}${params.filter}/p${pageNumber}/`;
    };
    const filter = `${params.urlPath}`;

    const getPageResults = async pageNumber => {
      const list = await getList(this.browser, getListUrl(pageNumber), filter);
      return getResults(list.hrefs);
    };

    const list = await getList(this.browser, getListUrl(1), filter);

    winston.log('info', `${params.description}: Scraping ${list.pageCount} pages of results`);

    let promises = [getResults(list.hrefs)];
    if (list.pageCount > 1) {
      const pages = range(2, list.pageCount);
      promises = promises.concat(pages.map(pageNumber => getPageResults(pageNumber)));
    }

    const resultArrays = await Promise.all(promises);
    const results = [].concat(...resultArrays);

    winston.log('info', `${params.description}: Count: ${results.length}`);
  }
}
