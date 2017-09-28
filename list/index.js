const winston = require('winston');
const getHrefs = require('./hrefs');
const getPageCount = require('./page-count');

const DEFAULT_LIST_DELAY = 5000;

module.exports = async (browser, url, filter, delay = DEFAULT_LIST_DELAY) => {
  winston.log('info', `loading list page: ${url}`);
  const page = await browser.openPage(url, delay);
  const hrefs = await getHrefs(page, filter);
  const pageCount = await getPageCount(page);
  await browser.closePage(page);
  return {
    pageCount,
    hrefs,
  };
};
