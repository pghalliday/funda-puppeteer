module.exports.get = async ({page}) => {
  const divs = await page.$$('div.object-kenmerken-body');
  const historyDiv = divs.length > 1 ? divs[0] : undefined;
  if (historyDiv) {
    return historyDiv.evaluate(element => {
      const zip = (keys, values) => {
        return keys.reduce((zipped, key, index) => ({
          ...zipped,
          [key]: values[index],
        }), {});
      };

      const keys = [...element.querySelectorAll(':scope > dl > dt')].map(element => element.textContent.trim());
      const values = [...element.querySelectorAll(':scope > dl > dt + dd')].map(element => element.textContent.trim());
      return zip(keys, values);
    });
  } else {
    return undefined;
  }
};
