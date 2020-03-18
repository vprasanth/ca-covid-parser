import https from 'https';
import cheerio from 'cheerio';
import cc from 'camelcase';

export function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(data);
        });
      })
      .on('error', err => {
        reject(err);
      });
  });
}

export function parsePage(data) {
  let tableSelector = '';
  let dateRegex = /.*As of (\w.*)\s(\d*),\s(\d*),/i;
  const $ = cheerio.load(data);

  if ($('div.table-responsive').length) {
    // old
    tableSelector = 'div.table-responsive > table';
  } else {
    tableSelector = 'main > div > table';
  }

  const table = $(tableSelector).first();

  const match = dateRegex.exec($('body').text());
  const date = new Date(
    `${match[1]} ${match[2]} ${match[3]} 00:00:00`,
  ).toISOString();

  const headings = table.find('thead > tr > th');
  let keys;
  if (headings.length === 3) {
    keys = ['location', 'confirmed', 'probable'];
  } else {
    keys = ['location', 'confirmed'];
  }

  const body = table.find('tbody > tr');

  const cases = [];
  body.each(function(elm) {
    let report = {};
    $(this)
      .find('td')
      .each(function(i, elm) {
        if (i === 0) {
          report[keys[i]] = cc($(this).text());
        } else {
          report[keys[i]] = parseInt($(this).text(), 10);
        }
      });
    cases.push(report);
  });

  return [cases, date];
}
