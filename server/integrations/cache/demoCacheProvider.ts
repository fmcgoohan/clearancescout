export class DemoCacheProvider {
  private cache: Map<string, any> = new Map();

  constructor() {
    this.cache.set('Coca-Cola', {
      trademarkStatus: 'REGISTERED_ACTIVE',
      owner: 'The Coca-Cola Company',
      class: 'IC 032 - Soft Drinks & Beverages',
    });
    this.cache.set('Porsche', {
      trademarkStatus: 'REGISTERED_ACTIVE',
      owner: 'Dr. Ing. h.c. F. Porsche AG',
      class: 'IC 012 - Automobiles',
    });
  }

  get(key: string): any | null {
    return this.cache.get(key) || null;
  }

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }
}

export const demoCacheProvider = new DemoCacheProvider();
