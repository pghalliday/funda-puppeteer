const wait = require('../util/wait');

const DEFAULT_EXPAND_DELAY = 1000;

module.exports = async (page, delay = DEFAULT_EXPAND_DELAY) => {
  // click the expand features button if there is one  and wait for it to load
  const expandButton = await page.$('button.object-kenmerken-open-button');
  if (expandButton) {
    expandButton.click();
    await wait(delay);
  }
  const divs = await page.$$('div.object-kenmerken-body');
  const featuresDiv = divs.length > 1 ? divs[1] : divs[0];
  return featuresDiv.evaluate(element => {
    const zip = (keys, values) => {
      return keys.reduce((zipped, key, index) => ({
        ...zipped,
        [key]: values[index],
      }), {});
    };

    const merge = (objects1, objects2) => {
      return objects1.map((object, index) => ({
        ...object,
        ...objects2[index],
      }));
    };

    const parsedl = element => {
      const groupkeys = [...element.querySelectorAll(':scope > dt.object-kenmerken-group-header')].map(element => element.textContent.trim());
      const grouplinks = [...element.querySelectorAll(':scope > dt.object-kenmerken-group-header + dd')].map(element => {
        const link = element.querySelector(':scope > a');
        if (link) {
          return {
            [link.textContent.trim()]: link.getAttribute('href'),
          };
        } else {
          return {};
        }
      });
      const groupfeatures = [...element.querySelectorAll(':scope > dt.object-kenmerken-group-header + dd + dd > dl')].map(element => parsedl(element));
      const keys = [...element.querySelectorAll(':scope > dt:not(.object-kenmerken-group-header)')].map(element => element.textContent.trim());
      const values = [...element.querySelectorAll(':scope > dt:not(.object-kenmerken-group-header) + dd')].map(element => element.textContent.trim());
      return {
        ...zip(keys, values),
        ...zip(groupkeys, merge(grouplinks, groupfeatures)),
      };
    };

    const keys = [...element.querySelectorAll(':scope > h3.object-kenmerken-list-header')].map(element => element.textContent.trim());
    const values = [...element.querySelectorAll(':scope > h3.object-kenmerken-list-header + dl')].map(element => parsedl(element));
    return zip(keys, values);
  });
};
