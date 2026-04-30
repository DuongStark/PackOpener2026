import { Injectable } from '@nestjs/common';

@Injectable()
export class RandomService {
  // Picks one item using weighted probability.
  weightedRandom<T>(items: Array<{ item: T; weight: number }>): T {
    if (!items.length) {
      throw new Error('weightedRandom requires at least one item');
    }

    const totalWeight = items.reduce((sum, entry) => {
      if (entry.weight < 0) {
        throw new Error('weight cannot be negative');
      }
      return sum + entry.weight;
    }, 0);

    if (totalWeight <= 0) {
      throw new Error('total weight must be greater than 0');
    }

    let threshold = Math.random() * totalWeight;

    for (const entry of items) {
      threshold -= entry.weight;
      if (threshold <= 0) {
        return entry.item;
      }
    }

    return items[items.length - 1].item;
  }
}
