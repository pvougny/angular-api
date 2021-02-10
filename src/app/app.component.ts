import { Component } from '@angular/core';
import * as moment from 'moment';
import * as _ from 'lodash';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  SectorResponse,
  StockApiService,
  StockResponse,
  STOCK_DATE_FORMAT,
} from './stock-api.service';

interface SectorItem {
  label: string;
  tickers: string[];
}

interface PeriodItem {
  label: string;
  value: {
    period: string;
    format: string;
  };
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    fill: boolean;
    borderColor: string;
  }[];
}

const COLORS: string[] = ['#50ba1f', '#3670c7', '#eb357b'];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public series: ChartData[];
  public sectors: SectorItem[];
  public selectedSector: SectorItem;
  public periods: PeriodItem[];
  public selectedPeriod: PeriodItem;

  constructor(private readonly stockApiService: StockApiService) {
    this._initPeriods();
    this._initSectors();
  }

  public changeSector(event: {
    originalEvent: Event;
    value: SectorItem;
  }): void {
    this.selectedSector = event.value;
    this._updateData();
  }

  public changePeriod(event: {
    originalEvent: Event;
    value: PeriodItem;
  }): void {
    this.selectedPeriod = event.value;
    this._updateData();
  }

  private _initPeriods(): void {
    this.periods = [
      { label: '1W', value: { period: '7D', format: 'DD MMMM' } },
      { label: '1M', value: { period: '1M', format: 'DD MMMM' } },
      { label: '3M', value: { period: '3M', format: 'DD/MM/Y' } },
      { label: '6M', value: { period: '6M', format: 'DD/MM/Y' } },
      { label: '1Y', value: { period: '1Y', format: 'DD/MM/Y' } },
      { label: '2Y', value: { period: '2Y', format: 'MM/Y' } },
      { label: '5Y', value: { period: '5Y', format: 'MM/Y' } },
    ];
    this.selectedPeriod =
      this.periods.find((period) => period.value.period === '6M') ||
      this.periods[0];
  }

  private _initSectors(): void {
    this.stockApiService.getSectors().subscribe((res: SectorResponse[]) => {
      this.sectors = Object.values(_.groupBy(res, 'sector')).map(
        (value: SectorResponse[]) => ({
          label: value[0].sector,
          tickers: value.map((item) => item.ticker),
        })
      );
      this.selectedSector = this.sectors[0];
      this.series = this.selectedSector.tickers.map((ticker, i) => ({
        labels: [],
        datasets: [
          {
            label: ticker,
            data: [],
            fill: false,
            borderColor: COLORS[i],
          },
        ],
      }));
      this._updateData();
    });
  }

  private _updateData(): void {
    combineLatest(
      this.selectedSector.tickers.map((ticker, i) =>
        this.stockApiService
          .getStocks(ticker, this.selectedPeriod.value.period)
          .pipe(
            map(
              (res: StockResponse[]): ChartData => {
                return {
                  labels: res.map((stock) =>
                    moment(stock.date, STOCK_DATE_FORMAT).format(
                      this.selectedPeriod.value.format
                    )
                  ),
                  datasets: [
                    {
                      label: ticker,
                      data: res.map((stock) => stock.spot),
                      fill: false,
                      borderColor: COLORS[i],
                    },
                  ],
                };
              }
            )
          )
      )
    ).subscribe((res: ChartData[]) => {
      this.series = res;
    });
  }
}
