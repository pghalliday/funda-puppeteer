const wait = require('../util/wait');

const DEFAULT_EXPAND_DELAY = 1000;

module.exports = async (page, delay = DEFAULT_EXPAND_DELAY) => {
  // click the expand description button and wait for it to load
  await page.click('button.object-description-open-button');
  await wait(delay);
  const descriptionElement = await page.$('div.object-description-body');
  return await descriptionElement.evaluate(element => element.textContent.trim());
};
