import type { RevenueGranularity } from './admin-revenue-query.dto.js';

export type AdminRevenueDataPoint = {
  date: string;
  coinIn: number;
  coinOut: number;
  netRevenue: number;
  packsSold: number;
  cardsSold: number;
};

export type AdminRevenueResponse = {
  from: string;
  to: string;
  granularity: RevenueGranularity;
  data: AdminRevenueDataPoint[];
  summary: {
    totalCoinIn: number;
    totalCoinOut: number;
    netRevenue: number;
  };
};
