const fs = require('fs');
const sanitize = require('sanitize-filename');
const path = require('path');
const mkdirp = require('mkdirp');
const winston = require('winston');
const _id = require('./id');
const _address = require('./address');
const _description = require('./description');
const _history = require('./history');
const _features = require('./features');
const checkAge = require('../util/check-age').checkAge;

const DEFAULTS = {
  DELAY: 5000,
  MAX_RECHECK_DAYS: 7,
  DESCRIPTION: {
    DELAY: _description.DEFAULTS.DELAY,
  },
  FEATURES: {
    DELAY: _features.DEFAULTS.DELAY,
  },
};
module.exports.DEFAULTS = DEFAULTS;

module.exports.collect = async ({
  browser,
  url,
  outputdir,
  timestamp,
  maxRecheckDays = DEFAULTS.MAX_RECHECK_DAYS,
  delay = DEFAULTS.DELAY,
  description: {
    delay: descriptionDelay = DEFAULTS.DESCRIPTION.DELAY,
  } = {},
  features: {
    delay: featuresDelay = DEFAULTS.FEATURES.DELAY,
  } = {},
} = {}) => {
  const urlParts = url.split('/').slice(-3);
  const place = urlParts[0];
  const ref = urlParts[1];
  outputdir = path.join(outputdir, place, ref);
  mkdirp.sync(outputdir);
  if (checkAge(outputdir, timestamp, maxRecheckDays)) {
    winston.log('info', `loading result: ${place}/${ref}`);
    const page = await browser.openPage(url, delay);
    page.on('console', (...args) => {
      winston.log('debug', ...args);
    });
    const id = await _id.get({page});
    if (id) {
      const address = await _address.get({page});
      const sanitizedAddress = sanitize(address);
      const description = await _description.get({page, delay: descriptionDelay});
      const history = await _history.get({page});
      const features = await _features.get({page, delay: featuresDelay});
      await browser.closePage(page);
      const result = {
        id,
        ref,
        place,
        url,
        address,
        sanitizedAddress,
        description,
        history,
        features,
      };
      const resultJSON = JSON.stringify(result, null, 2);
      winston.log('debug', resultJSON);
      return new Promise((resolve, reject) => {
        const out = path.join(outputdir, `${timestamp}.json`);
        fs.writeFile(out, resultJSON, err => {
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
  }
}
