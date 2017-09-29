module.exports = async (page) => {
  const featuresDiv = await page.$('div.object-kenmerken-body');
  return featuresDiv.evaluate(element => {
    const zip = (labels, features) => {
      return labels.reduce((zipped, label, index) => ({
        ...zipped,
        [label]: features[index],
      }), {});
    };

    const merge = (objects1, objects2) => {
      return objects1.map((object, index) => ({
        ...object,
        ...objects2[index],
      }));
    };

    const parsedl = element => {
      const groups = [...element.querySelectorAll(':scope > dt.object-kenmerken-group-header')].map(element => element.textContent.trim());
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
      const labels = [...element.querySelectorAll(':scope > dt:not(.object-kenmerken-group-header)')].map(element => element.textContent.trim());
      const features = [...element.querySelectorAll(':scope > dt:not(.object-kenmerken-group-header) + dd')].map(element => element.textContent.trim());
      return {
        ...zip(labels, features),
        ...zip(groups, merge(grouplinks, groupfeatures)),
      };
    };

    const labels = [...element.querySelectorAll(':scope > h3.object-kenmerken-list-header')].map(element => element.textContent.trim());
    const features = [...element.querySelectorAll(':scope > h3.object-kenmerken-list-header + dl')].map(element => parsedl(element));
    return zip(labels, features);
  });
};
