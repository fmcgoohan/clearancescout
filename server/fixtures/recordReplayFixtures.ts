/**
 * Structured Record-Replay Fixtures for Offline Contract Testing & Deterministic Demos.
 * Used exclusively in TEST_MODE and DEMO_MODE.
 * Newly captured in repository for ClearanceScout.
 */

export interface ParallelTrademarkFixture {
  queryKey: string;
  sourceUrl: string;
  excerptSnippet: string;
  registrationStatus: 'REGISTERED_ACTIVE' | 'PENDING' | 'EXPIRED' | 'UNKNOWN';
  corporateOwner: string;
  disputePrecedents: string;
  niceClassifications?: number[];
}

export interface ScriptParserFixture {
  keyword: string;
  scenes: Array<{
    sceneNumber: number;
    heading: string;
    locationType: 'INT' | 'EXT';
    timeOfDay: string;
    rawText: string;
    characterActionSummary: string;
    entities: Array<{
      name: string;
      category: 'BRAND_OR_PRODUCT' | 'CORPORATION' | 'PUBLIC_FIGURE' | 'REAL_WORLD_LOCATION' | 'COPYRIGHTED_WORK';
      context: string;
    }>;
  }>;
}

export interface ReplacementConceptFixture {
  category: string;
  eraAesthetic: string;
  candidates: Array<{
    candidateName: string;
    visualPrompt: string;
    clearanceStatus: 'NO_ISSUE_SURFACED' | 'REVIEW_RECOMMENDED' | 'ACTION_REQUIRED' | 'INSUFFICIENT_EVIDENCE';
    rationale: string;
  }>;
}

// 1. Parallel Trademark Search Benchmark Fixtures
export const PARALLEL_SEARCH_FIXTURES: Record<string, ParallelTrademarkFixture> = {
  'coca-cola': {
    queryKey: 'coca-cola',
    sourceUrl: 'https://uspto.gov/trademarks/search?q=coca-cola',
    excerptSnippet: 'USPTO Registration #71022406 for COCA-COLA. Active principal register trademark covering non-alcoholic beverages and syrups.',
    registrationStatus: 'REGISTERED_ACTIVE',
    corporateOwner: 'The Coca-Cola Company (Atlanta, GA)',
    disputePrecedents: 'Strict trademark protection across beverage, merchandise, and commercial media depictions.',
    niceClassifications: [32, 25, 41]
  },
  'apple': {
    queryKey: 'apple',
    sourceUrl: 'https://uspto.gov/trademarks/search?q=apple',
    excerptSnippet: 'USPTO Registration for APPLE. Active global trademark covering computer hardware, mobile electronic devices, and consumer software.',
    registrationStatus: 'REGISTERED_ACTIVE',
    corporateOwner: 'Apple Inc. (Cupertino, CA)',
    disputePrecedents: 'Strict brand guidelines on consumer electronics, hardware logo visibility, and UI depictions in commercial film and TV.',
    niceClassifications: [9, 42]
  },
  'porsche': {
    queryKey: 'porsche',
    sourceUrl: 'https://uspto.gov/trademarks/search?q=porsche',
    excerptSnippet: 'USPTO Registration for PORSCHE and crest insignia. Active trademark covering motor vehicles, automotive parts, and luxury accessories.',
    registrationStatus: 'REGISTERED_ACTIVE',
    corporateOwner: 'Dr. Ing. h.c. F. Porsche AG (Stuttgart, Germany)',
    disputePrecedents: 'Enforces vehicle trade dress and badge trademark protection in video games, cinema, and merchandising.',
    niceClassifications: [12, 25]
  },
  'bohemian rhapsody': {
    queryKey: 'bohemian rhapsody',
    sourceUrl: 'https://www.ascap.com/repertory#/ace/work/320146000',
    excerptSnippet: 'ASCAP/BMI Work #320146000 for BOHEMIAN RHAPSODY by Freddie Mercury. Registered musical composition and master recording.',
    registrationStatus: 'REGISTERED_ACTIVE',
    corporateOwner: 'Queen Music Ltd. / Sony Music Publishing',
    disputePrecedents: 'Requires synchronized music master & publishing license for any commercial film usage or dramatic synchronization.',
    niceClassifications: [41, 9]
  },
  'empire state building': {
    queryKey: 'empire state building',
    sourceUrl: 'https://uspto.gov/trademarks/search?q=empire+state+building',
    excerptSnippet: 'USPTO Registration for the architectural facade and name EMPIRE STATE BUILDING. Active commercial building trademark.',
    registrationStatus: 'REGISTERED_ACTIVE',
    corporateOwner: 'Empire State Realty Trust (New York, NY)',
    disputePrecedents: 'Building design trademark and landmark rights require commercial photography, CGI, and depiction clearance.',
    niceClassifications: [36, 41]
  },
  'summit cola': {
    queryKey: 'summit cola',
    sourceUrl: 'https://uspto.gov/trademarks/search?q=summit+cola',
    excerptSnippet: 'USPTO Registration #88000001 for SUMMIT COLA. Registered trademark for regional carbonated soft drinks and beverages.',
    registrationStatus: 'REGISTERED_ACTIVE',
    corporateOwner: 'Summit Beverage Group LLC (Denver, CO)',
    disputePrecedents: 'Regional trademark registration active in Class 32; no pending federal litigation surfaced.',
    niceClassifications: [32]
  },
  'aerotech': {
    queryKey: 'aerotech',
    sourceUrl: 'https://uspto.gov/trademarks/search?q=aerotech',
    excerptSnippet: 'USPTO Registration #88000002 for AEROTECH. Registered trademark for aerospace avionics, components, and navigational hardware.',
    registrationStatus: 'REGISTERED_ACTIVE',
    corporateOwner: 'AeroTech Systems International (Seattle, WA)',
    disputePrecedents: 'Industrial aerospace trademark active; commercial film depictions in fictional aviation context recommended for review.',
    niceClassifications: [9, 12]
  },
  'veloce gt': {
    queryKey: 'veloce gt',
    sourceUrl: 'https://uspto.gov/trademarks/search?q=veloce+gt',
    excerptSnippet: 'USPTO Record for VELOCE GT. Registered active automotive marque for high-performance sports vehicles and concept cars.',
    registrationStatus: 'REGISTERED_ACTIVE',
    corporateOwner: 'Veloce Automobili S.p.A. (Turin, Italy)',
    disputePrecedents: 'Active automotive trade dress registration; review recommended for high-profile cinematic hero vehicle placement.',
    niceClassifications: [12]
  },
  'elena vance': {
    queryKey: 'elena vance',
    sourceUrl: 'https://en.wikipedia.org/wiki/Elena_Vance',
    excerptSnippet: 'Public biographical registry for Elena Vance, pioneer in orbital clean energy grids and clean power infrastructure.',
    registrationStatus: 'REGISTERED_ACTIVE',
    corporateOwner: 'Elena Vance Trust / Orbital Energy Institute',
    disputePrecedents: 'Living public figure; incidental or archival broadcast portrayal permitted with standard documentary clearance.',
    niceClassifications: [41]
  },
  'nocturne of the wild': {
    queryKey: 'nocturne of the wild',
    sourceUrl: 'https://www.ascap.com/repertory#/ace/work/99000003',
    excerptSnippet: 'ASCAP Work #99000003 for NOCTURNE OF THE WILD. Registered musical work and synthetic audio master.',
    registrationStatus: 'REGISTERED_ACTIVE',
    corporateOwner: 'SynthWave Publishing Ltd / Neon Audio Masters',
    disputePrecedents: 'Background spatial audio playback cleared for incidental film synchronization under standard publisher sync.',
    niceClassifications: [41, 9]
  },
  'midtown spire tower': {
    queryKey: 'midtown spire tower',
    sourceUrl: 'https://uspto.gov/trademarks/search?q=midtown+spire+tower',
    excerptSnippet: 'Property and Architectural Registry for MIDTOWN SPIRE TOWER. Commercial high-rise and private circular plaza.',
    registrationStatus: 'REGISTERED_ACTIVE',
    corporateOwner: 'Midtown Architectural Properties Trust (New York, NY)',
    disputePrecedents: 'Exterior building facade and plaza; cleared for exterior establishment shots under incidental location filming.',
    niceClassifications: [36, 41]
  },
  'titan industrial hazard placard': {
    queryKey: 'titan industrial hazard placard',
    sourceUrl: 'https://osha.gov/standards/safety-signs?q=titan-hazard',
    excerptSnippet: 'Standard ANSI/OSHA Industrial Safety Warning Placard format for heavy circuit bulkhead signage.',
    registrationStatus: 'REGISTERED_ACTIVE',
    corporateOwner: 'Titan Industrial Safety Standards / Public Domain Standard',
    disputePrecedents: 'Standard industrial safety prop; no proprietary commercial trademark infringement surfaced.',
    niceClassifications: [9]
  }
};

// 2. Script Parser Benchmark Fixtures
export const SCRIPT_PARSER_FIXTURES: Record<string, ScriptParserFixture> = {
  'the neon horizon': {
    keyword: 'the neon horizon',
    scenes: [
      {
        sceneNumber: 1,
        heading: 'INT. CYBERPUNK CAFE - NIGHT',
        locationType: 'INT',
        timeOfDay: 'NIGHT',
        rawText: 'MAYA sits in the corner of a dimly lit noodle bar, sipping a cold Summit Cola while checking data on an Apple iPad.',
        characterActionSummary: 'Maya drinks Summit Cola and operates an Apple iPad in a futuristic diner.',
        entities: [
          { name: 'Summit Cola', category: 'BRAND_OR_PRODUCT', context: 'Sipping a cold Summit Cola' },
          { name: 'Apple iPad', category: 'BRAND_OR_PRODUCT', context: 'Checking data on an Apple iPad' }
        ]
      },
      {
        sceneNumber: 2,
        heading: 'EXT. METROPOLIS SKYWAY - NIGHT',
        locationType: 'EXT',
        timeOfDay: 'NIGHT',
        rawText: 'Maya accelerates in a matte black Veloce GT past the holographic glow of the Empire State Building.',
        characterActionSummary: 'Maya drives a Veloce GT past the Empire State Building.',
        entities: [
          { name: 'Veloce GT', category: 'BRAND_OR_PRODUCT', context: 'Accelerates in a matte black Veloce GT' },
          { name: 'Empire State Building', category: 'REAL_WORLD_LOCATION', context: 'Past the holographic glow of the Empire State Building' }
        ]
      }
    ]
  }
};

// 3. Replacement Brand Concept Benchmark Fixtures
export const REPLACEMENT_CONCEPT_FIXTURES: Record<string, ReplacementConceptFixture> = {
  'beverage': {
    category: 'BRAND_OR_PRODUCT',
    eraAesthetic: 'Cyberpunk Neon',
    candidates: [
      {
        candidateName: 'Pulse Nova Zero',
        visualPrompt: 'Futuristic holographic aluminum can with neon blue glow and geometric typography.',
        clearanceStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Fictional synthetic brand name with zero conflicting registrations across USPTO Class 32.'
      },
      {
        candidateName: 'Zenith Sparkle',
        visualPrompt: 'Sleek frosted glass bottle with glowing gold cyber-script.',
        clearanceStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Clean fictional candidate cleared across international beverage registries.'
      }
    ]
  },
  'automotive': {
    category: 'BRAND_OR_PRODUCT',
    eraAesthetic: 'Futuristic Sports Coupe',
    candidates: [
      {
        candidateName: 'AeroStrike Apex GT',
        visualPrompt: 'Aerodynamic carbon-composite electric supercar with glowing neon amber taillights.',
        clearanceStatus: 'NO_ISSUE_SURFACED',
        rationale: 'Unique fictional automotive model designation with zero trademark conflicts in Class 12.'
      }
    ]
  }
};
