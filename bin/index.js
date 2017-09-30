#!/usr/bin/env node

const path = require('path');
const winston = require('winston');
const fundaPuppeteer = require('../');

const argv = require('yargs')
.version()
.env('FUNDA_PUPPETEER')
.usage(`$0 [args]

Collect and archive data from https://www.funda.nl/`)
.options({
  'p': {
    alias: 'place',
    demandOption: true,
    default: fundaPuppeteer.DEFAULTS.PLACE,
    describe: 'The place to search',
    type: 'string',
  },
  'o': {
    alias: 'outputdir',
    demandOption: true,
    default: fundaPuppeteer.DEFAULTS.OUTPUTDIR,
    describe: 'The path to the output directory',
    type: 'string',
  },
  'c': {
    alias: 'categories',
    demandOption: false,
    default: fundaPuppeteer.DEFAULTS.CATEGORIES,
    describe: 'list of categories to query (searches all if omitted)',
    type: 'array',
    choices: fundaPuppeteer.CATEGORIES,
  },
  'k': {
    alias: 'google-api-key',
    demandOption: false,
    describe: 'The google API key for geocoding the addresses (will skip geocoding if omitted)',
    type: 'string',
  },
  'r': {
    alias: 'result-recheck-days',
    demandOption: false,
    describe: 'Maximum number of days before a result should be rechecked (0 to check every run)',
    type: 'number',
    default: fundaPuppeteer.DEFAULTS.RESULT.MAX_RECHECK_DAYS,
  },
  'g': {
    alias: 'geocode-recheck-days',
    demandOption: false,
    describe: 'Maximum number of days before geocode data should be rechecked (0 to check every run)',
    type: 'number',
    default: fundaPuppeteer.DEFAULTS.GEOCODE.MAX_RECHECK_DAYS,
  },
  'm': {
    alias: 'max-concurrent-pages',
    demandOption: false,
    describe: 'Maximum number of browser pages to load concurrently',
    type: 'number',
    default: fundaPuppeteer.DEFAULTS.BROWSER.MAX_CONCURRENT_PAGES,
  },
  'u': {
    alias: 'user-agent',
    demandOption: false,
    describe: 'The user agent string to use for requests',
    type: 'string',
    default: fundaPuppeteer.DEFAULTS.BROWSER.USER_AGENT,
  },
  'l': {
    alias: 'log-level',
    demandOption: true,
    default: winston.level,
    describe: 'The log level for console output',
    choices: Object.keys(winston.levels),
  },
  'list-page-delay': {
    demandOption: false,
    describe: 'The number of milliseconds to wait for javascript to run on the list pages',
    type: 'number',
    default: fundaPuppeteer.DEFAULTS.LIST.DELAY,
  },
  'result-page-delay': {
    demandOption: false,
    describe: 'The number of milliseconds to wait for javascript to run on the result pages',
    type: 'number',
    default: fundaPuppeteer.DEFAULTS.RESULT.DELAY,
  },
  'description-delay': {
    demandOption: false,
    describe: 'The number of milliseconds to wait for the result description to expand',
    type: 'number',
    default: fundaPuppeteer.DEFAULTS.RESULT.DESCRIPTION.DELAY,
  },
  'features-delay': {
    demandOption: false,
    describe: 'The number of milliseconds to wait for the result features to expand',
    type: 'number',
    default: fundaPuppeteer.DEFAULTS.RESULT.FEATURES.DELAY,
  },
})
.help()
.argv;

// set up the logger
winston.level = argv.logLevel;
winston.log('debug', JSON.stringify(argv, null, 2));

// run the scraper
(async () => {
  try {
    await fundaPuppeteer.collect({
      place: argv.place,
      outputdir: argv.outputdir,
      categories: argv.categories,
      browser: {
        maxConcurrentPages: argv.maxConcurrentPages,
        userAgent: argv.userAgent,
      },
      list: {
        delay: argv.listPageDelay,
      },
      result: {
        delay: argv.resultPageDelay,
        maxRecheckDays: argv.resultRecheckDays,
        description: {
          delay: argv.descriptionDelay,
        },
        features: {
          delay: argv.featuresDelay,
        },
      },
      geocode: {
        apiKey: argv.googleApiKey,
        maxRecheckDays: argv.geocodeRecheckDays,
      },
    });
  } catch (e) {
    winston.log('error', e);
  }
})();
