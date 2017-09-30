module.exports.get = async ({page, filter}) => {
  const resultLinks = await page.$$('div.search-result-media > a');
  const hrefs = await Promise.all(resultLinks.map(resultLink => {
    return resultLink.evaluate(link => link.getAttribute('href'));
  }));
  return hrefs.filter(href => href.startsWith(filter));
};
