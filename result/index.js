const winston = require('winston');
const getId = require('./id');
const getAddress = require('./address');
const getDescription = require('./description');
const getDetail = require('./detail');
const getGeocode = require('./geocode');

const DEFAULT_RESULT_DELAY = 5000;

module.exports = async (browser, url, delay = DEFAULT_RESULT_DELAY) => {
  winston.log('info', `loading result page: ${url}`);
  const page = await browser.openPage(url, delay);
  const id = await getId(page);
  const address = await getAddress(page);
  const description = await getDescription(page);
  const detail = await getDetail(page);
  await browser.closePage(page);
  const geocode = await getGeocode(address);
  const result = {
    url,
    id,
    address,
    description,
    detail,
    geocode,
  };
  winston.log('info', JSON.stringify(result, null, 2));
  return result;
}
