const { decode } = require('./codec-string.cjs');

const result = decode('avc1.64002A');
console.dir(result);
console.log(result.toHTML());