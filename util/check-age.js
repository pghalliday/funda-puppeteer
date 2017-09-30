const fs = require('fs');
const moment = require('moment');

// To evenly spread rechecks over days, this function randomly decides whether
// data is old given a maximum age using a uniform distribution
module.exports.checkAge = (dir, timestamp, maxRecheckDays) => {
  const timestamps = fs.readdirSync(dir).map(file => moment(file.slice(0, -5)));
  if (timestamps.length > 0) {
    timestamp = moment(timestamp);
    const maxTimestamp = moment.max(timestamps);
    const random = Math.random() * maxRecheckDays;
    const age = timestamp.diff(maxTimestamp, 'days', true);
    return random <= age;
  } else {
    return true;
  }
};
