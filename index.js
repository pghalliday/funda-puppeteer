#!/usr/bin/env node

const winston = require('winston');
const Scraper = require('./scraper');

const DEFAULT_LOCATION = 'amsterdam';
const DEFAULT_OUTPUT_DIR = 'output';

const argv = require('yargs')
.usage('$0 [args]')
.options({
  'p': {
    alias: 'place',
    demandOption: true,
    default: DEFAULT_LOCATION,
    describe: 'The place to search',
    type: 'string',
  },
  'o': {
    alias: 'outputdir',
    demandOption: true,
    default: DEFAULT_OUTPUT_DIR,
    describe: 'The path to the output directory',
    type: 'string',
  },
  'l': {
    alias: 'loglevel',
    demandOption: true,
    default: winston.level,
    describe: 'The log level for console output',
    choices: Object.keys(winston.levels),
  },
})
.help()
.argv;

// set up the logger
winston.level = argv.loglevel;

// create the scraper
const scraper = new Scraper(argv.place, argv.outputdir);

// run the scraper
(async () => {
  try {
    await scraper.run();
  } catch (e) {
    winston.log('error', e);
  }
})();
