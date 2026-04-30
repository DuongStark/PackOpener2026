export type AdminDashboardStatsResponse = {
  users: {
    total: number;
    newToday: number;
    activeToday: number;
  };
  packs: {
    totalSold: number;
    totalOpened: number;
    revenueToday: number;
  };
  cards: {
    totalTypes: number;
    totalInCirculation: number;
  };
  transactions: {
    totalVolume: number;
    todayVolume: number;
  };
  topCards: Array<{
    cardId: string;
    name: string;
    timesOpened: number;
  }>;
  generatedAt: string;
};