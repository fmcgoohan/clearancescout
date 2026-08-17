export class DemoCacheProvider {
  private cache: Map<string, any> = new Map();

  constructor() {
    this.cache.set('Coca-Cola', {
      category: 'BRAND',
      trademarkStatus: 'REGISTERED_ACTIVE',
      owner: 'The Coca-Cola Company (Atlanta, GA)',
      class: 'IC 032 - Soft Drinks & Beverages',
    });
    this.cache.set('Apple', {
      category: 'BRAND',
      trademarkStatus: 'REGISTERED_ACTIVE',
      owner: 'Apple Inc. (Cupertino, CA)',
      class: 'IC 009 - Computers & Consumer Electronics',
    });
    this.cache.set('Porsche', {
      category: 'BRAND',
      trademarkStatus: 'REGISTERED_ACTIVE',
      owner: 'Dr. Ing. h.c. F. Porsche AG (Stuttgart, Germany)',
      class: 'IC 012 - Automobiles',
    });
    this.cache.set('Bohemian Rhapsody', {
      category: 'ART_MUSIC',
      trademarkStatus: 'REGISTERED_ACTIVE',
      owner: 'Queen Music Ltd. / Sony Music Publishing',
      class: 'Copyright - Musical Composition & Sound Recording',
    });
    this.cache.set('Taylor Swift', {
      category: 'PUBLIC_FIGURE',
      trademarkStatus: 'REGISTERED_ACTIVE',
      owner: 'TAS Rights Management, LLC',
      class: 'Right of Publicity / Registered Name & Likeness',
    });
    this.cache.set('Empire State Building', {
      category: 'PROPRIETARY_LOCATION',
      trademarkStatus: 'REGISTERED_ACTIVE',
      owner: 'Empire State Realty Trust',
      class: 'Architectural Design Trademark',
    });
    this.cache.set('Acme Explosives Warning', {
      category: 'GRAPHIC_PROP',
      trademarkStatus: 'REGISTERED_ACTIVE',
      owner: 'Warner Bros. Entertainment / Public Domain Iconography',
      class: 'Prop Graphics & Hazard Signs',
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
