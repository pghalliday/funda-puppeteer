const wait = require('../util/wait');

const DEFAULT_EXPAND_DELAY = 1000;

module.exports = async (page, delay = DEFAULT_EXPAND_DELAY) => {
  // click the expand description button if there is one  and wait for it to load
  const expandButton = await page.$('button.object-description-open-button');
  if (expandButton) {
    expandButton.click();
    await wait(delay);
  }
  const descriptionElement = await page.$('div.object-description-body');
  return await descriptionElement.evaluate(element => element.textContent.trim());
};
