require('ts-node').register({ transpileOnly: true });
const { getApiDocs } = require('./src/lib/swagger.ts');
getApiDocs().then(spec => {
  console.log(JSON.stringify(spec, null, 2));
}).catch(e => {
  console.error("Swagger Builder Error:", e);
  process.exit(1);
});
