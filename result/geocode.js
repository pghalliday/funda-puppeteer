const winston = require('winston');

module.exports = (googleMapsClient, address) => {
  if (googleMapsClient) {
    const formattedAddress = address.replace('\n', ', ') + ', Netherlands';
    winston.log('info', `Querying geocode data for address: ${formattedAddress}`);
    return new Promise((resolve, reject) => {
      googleMapsClient.geocode({
        address: formattedAddress,
      }, function(err, response) {
        if (!err) {
          resolve(response.json.results);
        } else {
          reject(err);
        }
      });
    });
  } else {
    return undefined;
  }
};
