module.exports.get = async ({page}) => {
  const pageLinks = await page.$$('div.pagination-pages > a');
  const lastPageLink = pageLinks[pageLinks.length - 1];
  if (lastPageLink) {
    const countString = await lastPageLink.evaluate(link => link.getAttribute('data-pagination-page'));
    return parseInt(countString);
  } else {
    return 0;
  }
};
