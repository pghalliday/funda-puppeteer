module.exports.get = async ({page}) => {
  const detailDiv = await page.$('div.object-detail');
  return await detailDiv.evaluate(element => element.getAttribute('data-interaction-tinyid'));
};
