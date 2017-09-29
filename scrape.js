const googleMaps = require('@google/maps');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
const Browser = require('./util/browser');
const range = require('./util/range');
const getList = require('./list');
const getResult = require('./result');
const mkdirp = require('mkdirp');

const BASE_URL = 'https://www.funda.nl';

const SEARCHES = [{
  description: 'For Sale',
  urlPath: '/en/koop',
  filter: '',
  outputPath: 'for-sale',
}, {
  description: 'For Rent',
  urlPath: '/en/huur',
  filter: '',
  outputPath: 'for-rent',
}, {
  description: 'Sold',
  urlPath: '/en/koop',
  filter: '/verkocht',
  outputPath: 'sold',
}, {
  description: 'Rented',
  urlPath: '/en/huur',
  filter: '/verhuurd',
  outputPath: 'rented',
}];

module.exports = async (place, outputdir, googleApiKey) => {
  winston.log('info', `Scraping data for ${place}`);
  outputdir = path.join(path.resolve(outputdir), place, (new Date()).toISOString());
  winston.log('info', `Generating output in: ${outputdir}`);
  mkdirp.sync(outputdir);
  let googleMapsClient;
  if (googleApiKey) {
    googleMapsClient = googleMaps.createClient({
      key: googleApiKey,
    });
  } else {
    winston.log('info', `Skipping geocoding as no Google API Key provided`);
  }
  const browser = new Browser();
  await browser.init();
  await Promise.all(SEARCHES.map(async params => {
    winston.log('info', `${params.description}: Scraping`);
    const searchdir = path.join(outputdir, params.outputPath);
    winston.log('info', `${params.description}: Generating output in: ${searchdir}`);
    mkdirp.sync(searchdir);

    const getResults = hrefs => {
      return Promise.all(hrefs.map(href => getResult(browser, `${BASE_URL}${href}`, googleMapsClient).then(result => {
        if (result) {
          return new Promise((resolve, reject) => {
            const out = path.join(searchdir, result.ref);
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
      return `${BASE_URL}${params.urlPath}/${place}${params.filter}/p${pageNumber}/`;
    };
    const filter = `${params.urlPath}`;

    const getPageResults = async pageNumber => {
      const list = await getList(browser, getListUrl(pageNumber), filter);
      return getResults(list.hrefs);
    };

    const list = await getList(browser, getListUrl(1), filter);

    winston.log('info', `${params.description}: Scraping ${list.pageCount} pages of results`);

    let promises = [getResults(list.hrefs)];
    if (list.pageCount > 1) {
      const pages = range(2, list.pageCount);
      promises = promises.concat(pages.map(pageNumber => getPageResults(pageNumber)));
    }

    const resultArrays = await Promise.all(promises);
    const results = [].concat(...resultArrays);

    winston.log('info', `${params.description}: Count: ${results.length}`);
  }));
  browser.close();
};
