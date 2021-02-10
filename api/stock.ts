import * as express from 'express';
import * as moment from 'moment';

import { HttpCode } from './http-code.enum';

interface Stock {
  date: string;
  spot: number;
  ticker: string;
  sector: string;
}

type Range = 'D' | 'M' | 'Y';

const SECTORS: Partial<Stock>[] = [
  { ticker: 'APPL', sector: 'Technology' },
  { ticker: 'AMZN', sector: 'Technology' },
  { ticker: 'MSFT', sector: 'Technology' },
  { ticker: 'TSLA', sector: 'Automotive' },
  { ticker: 'RNLT', sector: 'Automotive' },
  { ticker: 'PEGT', sector: 'Automotive' },
  { ticker: 'AXA', sector: 'Finance' },
  { ticker: 'BARC', sector: 'Finance' },
  { ticker: 'PFZ', sector: 'Finance' },
];

const DATA_SIZE = 2_000;

// build random data mock
const DATA: Stock[] = [...new Array(DATA_SIZE)].map((_, i) => ({
  ...(SECTORS[i % SECTORS.length] as { ticker: string; sector: string }),
  date: moment().subtract(i, 'day').toISOString(),
  spot: 99.5 + Math.round(Math.random() * 3 * 100) / 100,
}));

export function stockApi(server: express.Express): void {
  // GET /stocks
  server.get('/api/stocks', (req, res) => {
    res.status(HttpCode.Success).send(SECTORS);
  });

  // GET /stocks/{ticker}?period=${period}
  // period: ^[0-9]+(D|M|Y)$
  server.get('/api/stocks/**', (req, res) => {
    // parse ticker
    const uri: string[] = req.url.split(/\?|&/);
    const ticker: string = uri[0].substr('/api/stocks/'.length);

    // validate ticker: required
    if (!ticker) {
      res.status(HttpCode.BadRequest).send('Bad request: ticker is missing.');
      return;
    }

    // parse params
    const params: Record<string, string> = uri
      .slice(1)
      .reduce((result, param) => {
        const [key, value] = param.split('=');
        return { ...result, [key]: value || null };
      }, {});

    // validate period: required
    if (!('period' in params)) {
      res.status(HttpCode.BadRequest).send('Bad request: period is missing.');
      return;
    }

    const match = params.period.match(/^(?<length>[0-9]+)(?<range>D|M|Y)$/);

    // validate period: format
    if (!match) {
      res
        .status(HttpCode.BadRequest)
        .send('Bad request: period format is incorrect.');
      return;
    }

    const momentUnitMap: Map<
      Range,
      moment.unitOfTime.DurationConstructor
    > = new Map([
      ['D', 'day'],
      ['M', 'month'],
      ['Y', 'year'],
    ]);

    const period: {
      length: moment.DurationInputArg1;
      range: moment.unitOfTime.DurationConstructor;
    } = {
      length: Number(match.groups.length),
      range: momentUnitMap.get(match.groups.range as Range),
    };

    res.status(HttpCode.Success).send(
      DATA

        // filter by ticker and date
        .filter(
          (record) =>
            record.ticker === ticker &&
            moment(record.date).add(period.length, period.range) >= moment()
        )

        // format
        .map((record) => ({
          date: moment(record.date).format('DD/MM/Y'),
          spot: record.spot,
        }))
    );
  });

  // GET 404
  server.get('/api/**', (req, res) => {
    res.status(HttpCode.NotFound).send('Not found');
  });
}
