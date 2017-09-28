module.exports = async (page) => {
  const titleElement = await page.$('h1.object-header-title');
  return await titleElement.evaluate(element => element.textContent.trim());
};
