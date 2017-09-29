const winston = require('winston');
const getId = require('./id');
const getAddress = require('./address');
const getDescription = require('./description');
const getHistory = require('./history');
const getFeatures = require('./features');
const getGeocode = require('./geocode');

const DEFAULT_RESULT_DELAY = 5000;

module.exports = async (browser, url, googleMapsClient, delay = DEFAULT_RESULT_DELAY) => {
  winston.log('info', `loading result page: ${url}`);
  const page = await browser.openPage(url, delay);
  page.on('console', (...args) => {
    winston.log('info', ...args);
  });
  const id = await getId(page);
  if (id) {
    const ref = url.split('/').slice(-2)[0];
    const address = await getAddress(page);
    const description = await getDescription(page);
    const history = await getHistory(page);
    const features = await getFeatures(page);
    await browser.closePage(page);
    const geocode = await getGeocode(googleMapsClient, address);
    const result = {
      id,
      ref,
      url,
      address,
      description,
      history,
      features,
      geocode,
    };
    winston.log('debug', JSON.stringify(result, null, 2));
    return result;
  } else {
    return undefined;
  }
}
