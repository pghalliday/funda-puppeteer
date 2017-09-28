const winston = require('winston');

module.exports = (delay) => new Promise((resolve) => {
  winston.log('info', `Waiting: ${delay}ms`);
  setTimeout(() => {
    resolve();
  }, delay);
});
