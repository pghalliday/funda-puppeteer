module.exports = async (page) => {
  const pageLinks = await page.$$('div.pagination-pages > a');
  const lastPageLink = pageLinks[pageLinks.length - 1];
  return await lastPageLink.evaluate(link => link.getAttribute('data-pagination-page'));
};
