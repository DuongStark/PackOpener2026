import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../core/database/prisma.service.js';
import { PackStatus, Type } from '../../generated/prisma/enums.js';
import {
  AdminRevenueQueryDto,
  type RevenueGranularity,
} from './dto/admin-revenue-query.dto.js';
import type {
  AdminRevenueDataPoint,
  AdminRevenueResponse,
} from './dto/admin-revenue.dto.js';

const DASHBOARD_CACHE_KEY = 'admin:stats:dashboard:v2';
const DASHBOARD_TTL_MS = 300000; // 5 phut

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getDashboardStats() {
    const cached = await this.cache.get(DASHBOARD_CACHE_KEY);
    if (cached) return cached;

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );

    const [
      usersTotal,
      usersNewToday,
      activeTodayDistinct,
      packsTotalSold,
      packsTotalOpened,
      revenueTodayAgg,
      cardsTotalTypes,
      cardsInCirculationAgg,
      transactionsTotalVolumeAgg,
      transactionsTodayVolumeAgg,
      topCardRows,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.transaction.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: startOfToday } },
      }),
      this.prisma.userPack.count(),
      this.prisma.userPack.count({ where: { status: PackStatus.OPENED } }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: Type.BUY_PACK,
          createdAt: { gte: startOfToday },
        },
      }),
      this.prisma.cards.count(),
      this.prisma.inventory.aggregate({ _sum: { quantity: true } }),
      this.prisma.transaction.aggregate({ _sum: { amount: true } }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: startOfToday } },
      }),
      this.prisma.packOpeningResult.groupBy({
        by: ['cardId'],
        _count: { cardId: true },
        orderBy: { _count: { cardId: 'desc' } },
        take: 10,
      }),
    ]);

    const topCardIds = topCardRows.map((r) => r.cardId);
    const cards = topCardIds.length
      ? await this.prisma.cards.findMany({
          where: { id: { in: topCardIds } },
          select: { id: true, name: true },
        })
      : [];

    const cardNameMap = new Map(cards.map((c) => [c.id, c.name]));
    const response = {
      users: {
        total: usersTotal,
        newToday: usersNewToday,
        activeToday: activeTodayDistinct.length,
      },
      packs: {
        totalSold: packsTotalSold,
        totalOpened: packsTotalOpened,
        revenueToday: Math.abs(revenueTodayAgg._sum.amount ?? 0),
      },
      cards: {
        totalTypes: cardsTotalTypes,
        totalInCirculation: cardsInCirculationAgg._sum.quantity ?? 0,
      },
      transactions: {
        totalVolume: Math.abs(transactionsTotalVolumeAgg._sum.amount ?? 0),
        todayVolume: Math.abs(transactionsTodayVolumeAgg._sum.amount ?? 0),
      },
      topCards: topCardRows.map((r) => ({
        cardId: r.cardId,
        name: cardNameMap.get(r.cardId) ?? 'Unknown card',
        timesOpened: r._count.cardId,
      })),
      generatedAt: now.toISOString(),
    };

    await this.cache.set(DASHBOARD_CACHE_KEY, response, DASHBOARD_TTL_MS);
    return response;
  }

  async invalidateDashboardStatsCache() {
    await this.cache.del(DASHBOARD_CACHE_KEY);
  }

  async getRevenueStats(
    query: AdminRevenueQueryDto,
  ): Promise<AdminRevenueResponse> {
    const now = new Date();
    const today = this.toDateOnlyUtc(now);
    const fromDateOnly = query.from
      ? this.parseDateOnly(query.from)
      : this.addDays(today, -7);
    const toDateOnly = query.to ? this.parseDateOnly(query.to) : today;
    const granularity: RevenueGranularity = query.granularity ?? 'day';

    if (fromDateOnly.getTime() > toDateOnly.getTime()) {
      throw new BadRequestException(
        'Invalid date range: from must be less than or equal to to.',
      );
    }

    const rangeStart = fromDateOnly;
    const rangeEndExclusive = this.addDays(toDateOnly, 1);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: rangeStart,
          lt: rangeEndExclusive,
        },
      },
      select: {
        amount: true,
        type: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const grouped = new Map<string, AdminRevenueDataPoint>();

    for (const tx of transactions) {
      const key = this.toBucketKey(tx.createdAt, granularity);
      const current = grouped.get(key) ?? {
        date: key,
        coinIn: 0,
        coinOut: 0,
        netRevenue: 0,
        packsSold: 0,
        cardsSold: 0,
      };

      if (tx.amount < 0) {
        current.coinIn += Math.abs(tx.amount);
      } else {
        current.coinOut += tx.amount;
      }

      if (tx.type === Type.BUY_PACK) {
        current.packsSold += 1;
      }

      if (tx.type === Type.SELL_CARD) {
        current.cardsSold += 1;
      }

      current.netRevenue = current.coinIn - current.coinOut;
      grouped.set(key, current);
    }

    const data = Array.from(grouped.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const summary = data.reduce(
      (acc, item) => {
        acc.totalCoinIn += item.coinIn;
        acc.totalCoinOut += item.coinOut;
        return acc;
      },
      {
        totalCoinIn: 0,
        totalCoinOut: 0,
      },
    );

    return {
      from: this.formatDateOnly(fromDateOnly),
      to: this.formatDateOnly(toDateOnly),
      granularity,
      data,
      summary: {
        ...summary,
        netRevenue: summary.totalCoinIn - summary.totalCoinOut,
      },
    };
  }

  private parseDateOnly(value: string): Date {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid ISO date: ${value}`);
    }
    return parsed;
  }

  private toDateOnlyUtc(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  }

  private formatDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private toBucketKey(date: Date, granularity: RevenueGranularity): string {
    if (granularity === 'day') {
      return date.toISOString().slice(0, 10);
    }

    if (granularity === 'month') {
      return date.toISOString().slice(0, 7);
    }

    return this.toIsoWeekKey(date);
  }

  private toIsoWeekKey(date: Date): string {
    const utcDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const dayNumber = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil(
      ((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return `${utcDate.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  }
}
