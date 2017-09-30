const path = require('path');
const winston = require('winston');
const _browser = require('./util/browser');
const range = require('./util/range');
const _list = require('./list');
const _result = require('./result');
const _geocode = require('./geocode');
const mkdirp = require('mkdirp');

const LOGS_DIR = 'logs';
const GEOCODES_DIR = 'geocodes';
const RESULTS_DIR = 'results';

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

module.exports.CATEGORIES = SEARCHES.map(search => search.outputPath);

const DEFAULTS = {
  PLACE: 'amsterdam',
  OUTPUTDIR: 'output',
  CATEGORIES: [],
  BROWSER: {
    MAX_CONCURRENT_PAGES: _browser.DEFAULTS.MAX_CONCURRENT_PAGES,
    USER_AGENT: _browser.DEFAULTS.USER_AGENT,
  },
  LIST: {
    DELAY: _list.DEFAULTS.DELAY,
  },
  RESULT: {
    DELAY: _result.DEFAULTS.DELAY,
    MAX_RECHECK_DAYS: _result.DEFAULTS.MAX_RECHECK_DAYS,
    DESCRIPTION: {
      DELAY: _result.DEFAULTS.DESCRIPTION.DELAY,
    },
    FEATURES: {
      DELAY: _result.DEFAULTS.FEATURES.DELAY,
    },
  },
  GEOCODE: {
    MAX_RECHECK_DAYS: _geocode.DEFAULTS.MAX_RECHECK_DAYS,
  },
};
module.exports.DEFAULTS = DEFAULTS;

module.exports.collect = async ({
  place = DEFAULTS.PLACE,
  outputdir = DEFAULTS.OUTPUTDIR,
  categories = DEFAULTS.CATEGORIES,
  browser: {
    maxConcurrentPages: browserMaxConcurrentPages = DEFAULTS.BROWSER.MAX_CONCURRENT_PAGES,
    userAgent: browserUserAgent = DEFAULTS.BROWSER.USER_AGENT,
  } = {},
  list: {
    delay: listDelay = DEFAULTS.LIST.DELAY,
  } = {},
  result: {
    delay: resultDelay = DEFAULTS.RESULT.DELAY,
    maxRecheckDays: resultMaxRecheckDays = DEFAULTS.RESULT.MAX_RECHECK_DAYS,
    description: {
      delay: resultDescriptionDelay = DEFAULTS.RESULT.DESCRIPTION.DELAY,
    } = {},
    features: {
      delay: resultFeaturesDelay = DEFAULTS.RESULT.FEATURES.DELAY,
    } = {},
  } = {},
  geocode: {
    apiKey: geocodeApiKey,
    maxRecheckDays: geocodeMaxRecheckDays = DEFAULTS.GEOCODE.MAX_RECHECK_DAYS,
  } = {},
} = {}) => {
  // create the timestamp
  const timestamp = new Date().toISOString();

  const logsDir = path.join(outputdir, LOGS_DIR);
  const geocodesDir = path.join(outputdir, GEOCODES_DIR);
  const resultsDir = path.join(outputdir, RESULTS_DIR);
  mkdirp.sync(logsDir);
  mkdirp.sync(geocodesDir);
  mkdirp.sync(resultsDir);

  winston.add(winston.transports.File, {
    filename: path.join(logsDir, `${timestamp}.log`)
  });

  winston.log('info', `Scraping data for ${place}`);

  const geocode = new _geocode.Geocode({apiKey: geocodeApiKey, timestamp, maxRecheckDays: geocodeMaxRecheckDays, outputdir: geocodesDir});

  const browser = new _browser.Browser({maxConcurrentPages: browserMaxConcurrentPages, userAgent: browserUserAgent});
  await browser.init();

  await Promise.all(SEARCHES.filter(params => categories.length === 0 ? true : categories.includes(params.outputPath)).map(async params => {
    winston.log('info', `${params.description}: Scraping`);
    const searchdir = path.join(resultsDir, params.outputPath);
    winston.log('info', `${params.description}: Generating output in: ${searchdir}`);
    mkdirp.sync(searchdir);

    const getResults = hrefs => {
      return Promise.all(hrefs.map(href => _result.collect({
        browser,
        url: `${BASE_URL}${href}`,
        outputdir: searchdir,
        timestamp,
        maxRecheckDays: resultMaxRecheckDays,
        delay: resultDelay,
        description: {
          delay: resultDescriptionDelay,
        },
        features: {
          delay: resultFeaturesDelay,
        },
      }).then(async result => {
        if (result) {
          await geocode.collect(result);
        }
      })));
    };

    const getListUrl = pageNumber => {
      return `${BASE_URL}${params.urlPath}/${place}${params.filter}/p${pageNumber}/`;
    };
    const filter = `${params.urlPath}`;

    const getPageResults = async pageNumber => {
      const list = await _list.get({browser, url: getListUrl(pageNumber), filter, delay: listDelay});
      return getResults(list.hrefs);
    };

    const list = await _list.get({browser, url: getListUrl(1), filter, delay: listDelay});

    winston.log('info', `${params.description}: Scraping ${list.pageCount} pages of results`);

    let promises = [getResults(list.hrefs)];
    if (list.pageCount > 1) {
      const pages = range.create(2, list.pageCount);
      promises = promises.concat(pages.map(pageNumber => getPageResults(pageNumber)));
    }
    await Promise.all(promises);
  }));
  browser.close();
};
