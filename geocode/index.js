const fs = require('fs');
const googleMaps = require('@google/maps');
const path = require('path');
const winston = require('winston');
const checkAge = require('../util/check-age').checkAge;
const mkdirp = require('mkdirp');

const DEFAULTS = {
  MAX_RECHECK_DAYS: 14,
};
module.exports.DEFAULTS = DEFAULTS;

module.exports.Geocode = class {
  constructor({apiKey, maxRecheckDays = DEFAULTS.MAX_RECHECK_DAYS, outputdir, timestamp}) {
    if (apiKey) {
      this.client = googleMaps.createClient({
        key: apiKey,
      });
      this.timestamp = timestamp;
      this.outputdir = outputdir;
      this.maxRecheckDays = maxRecheckDays;
    } else {
      winston.log('info', `Skipping geocoding as no API Key provided`);
    }
  }

  collect({address, sanitizedAddress}) {
    if (this.client) {
      const outputdir = path.join(this.outputdir, sanitizedAddress);
      mkdirp.sync(outputdir);
      if (checkAge(outputdir, this.timestamp, this.maxRecheckDays)) {
        winston.log('info', `Querying geocode data for address: ${address}`);
        return new Promise((resolve, reject) => {
          this.client.geocode({
            address: address,
          }, (err, response) => {
            if (err) {
              reject(err);
            } else {
              const results = response.json.results;
              const resultsJSON = JSON.stringify(results, null, 2);
              winston.log('debug', resultsJSON);
              const out = path.join(outputdir, `${this.timestamp}.json`);
              fs.writeFile(out, resultsJSON, err => {
                if (err) {
                  reject(err);
                } else {
                  resolve(results);
                }
              });
            }
          });
        });
      }
    }
  }
}
