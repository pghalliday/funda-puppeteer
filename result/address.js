module.exports.get = async ({page}) => {
  const titleElement = await page.$('h1.object-header-title');
  const rawAddress =  await titleElement.evaluate(element => element.textContent.trim());
  return rawAddress.replace('\n', ',').replace(/\s+/g, ' ') + ', Netherlands';
};
