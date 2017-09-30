const winston = require('winston');
const _hrefs = require('./hrefs');
const _pageCount = require('./page-count');

const DEFAULTS = {
  DELAY: 5000,
};
module.exports.DEFAULTS = DEFAULTS;

module.exports.get = async ({browser, url, filter, delay = DEFAULTS.DELAY}) => {
  winston.log('info', `loading list page: ${url}`);
  const page = await browser.openPage(url, delay);
  const hrefs = await _hrefs.get({page, filter});
  const pageCount = await _pageCount.get({page});
  await browser.closePage(page);
  return {
    pageCount,
    hrefs,
  };
};
