import https from 'https';
import process from 'process';
import cheerio from 'cheerio';
import cc from 'camelcase';

// const URL = 'https://www.canada.ca/en/public-health/services/diseases/2019-novel-coronavirus-infection.html';
const url = process.argv[2];

if (!url) {
  process.exit(1);
} else {
  init(url);
}

function init(url) {
  https
    .get(url, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        // console.log(data);
        const result = make(data);
        if (result[0].length) {
          console.log(result);
        } else {
          console.log('No data for', url);
        }
      });
    })
    .on('error', err => {
      console.log(err);
      process.exit(1);
    });
}

function make(data) {
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
