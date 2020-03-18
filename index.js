import process from 'process';

import {fetchPage, parsePage} from './lib/index.mjs';

const url = process.argv[2];
if (!url) {
  throw new Error('URL required!');
  process.exit(1);
}

init(url)
  .then(data => console.log(data))
  .catch(err => console.log(err));

async function init(url) {
  const page = await fetchPage(url);
  const data = parsePage(page);
  return data;
}
