const winston = require('winston');

module.exports = (delay) => new Promise((resolve) => {
  winston.log('debug', `Waiting: ${delay}ms`);
  setTimeout(() => {
    resolve();
  }, delay);
});
