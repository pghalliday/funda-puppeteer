const winston = require('winston');
const getId = require('./id');
const getAddress = require('./address');
const getDescription = require('./description');
const getFeatures = require('./features');
const getGeocode = require('./geocode');

const DEFAULT_RESULT_DELAY = 5000;

module.exports = async (browser, url, googleMapsClient, delay = DEFAULT_RESULT_DELAY) => {
  winston.log('info', `loading result page: ${url}`);
  const page = await browser.openPage(url, delay);
  const id = await getId(page);
  if (id) {
    const address = await getAddress(page);
    const description = await getDescription(page);
    const features = await getFeatures(page);
    await browser.closePage(page);
    const geocode = await getGeocode(googleMapsClient, address);
    const result = {
      url,
      id,
      address,
      description,
      features,
      geocode,
    };
    winston.log('debug', JSON.stringify(result, null, 2));
    return result;
  } else {
    return undefined;
  }
}
