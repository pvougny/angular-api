import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SectorResponse {
  ticker: string;
  sector: string;
}

export interface StockResponse {
  date: string; // STOCK_DATE_FORMAT
  spot: number;
}

export const STOCK_DATE_FORMAT = 'DD/MM/Y';

@Injectable({
  providedIn: 'root',
})
export class StockApiService {
  constructor(private http: HttpClient) {}

  public getSectors(): Observable<SectorResponse[]> {
    return this.http.get<SectorResponse[]>('/api/stocks');
  }

  public getStocks(
    ticker: string,
    period: string
  ): Observable<StockResponse[]> {
    return this.http.get<StockResponse[]>(`/api/stocks/${ticker}`, {
      params: { period },
    });
  }
}
