module.exports.create = (start, end) => (
  Array.from(Array(end - start + 1).keys()).map(i => i + start)
);
