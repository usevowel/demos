/**
 * Vehicle data structure for dropdowns
 * Contains years, makes, models, and engines organized hierarchically
 */

/**
 * Engine specification for a vehicle model
 */
export interface EngineOption {
  /** Engine display name */
  name: string
  /** Engine code/identifier */
  code: string
}

/**
 * Model variant with available engines
 */
export interface ModelVariant {
  /** Model variant name (e.g., "Overland", "Limited", "Base") */
  name: string
  /** Available engines for this variant */
  engines: EngineOption[]
}

/**
 * Vehicle model with variants
 */
export interface VehicleModel {
  /** Model name */
  name: string
  /** Available variants */
  variants: ModelVariant[]
}

/**
 * Vehicle make with models
 */
export interface VehicleMake {
  /** Make name */
  name: string
  /** Available models for this make */
  models: VehicleModel[]
}

/**
 * Vehicle data organized by year
 */
export interface VehicleDataByYear {
  /** Year */
  year: string
  /** Available makes for this year */
  makes: VehicleMake[]
}

/**
 * Available vehicle years (2020-2026)
 */
export const VEHICLE_YEARS: string[] = [
  '2026',
  '2025',
  '2024',
  '2023',
  '2022',
  '2021',
  '2020',
]

/**
 * Vehicle data organized by year
 * Contains makes, models, variants, and engines
 */
export const VEHICLE_DATA: VehicleDataByYear[] = [
  {
    year: '2026',
    makes: [
      {
        name: 'Acura',
        models: [
          {
            name: 'MDX',
            variants: [
              {
                name: 'Base',
                engines: [
                  { name: '3.5L 3471CC V6 FI', code: 'V6-FI' },
                  { name: '3.5L 3471CC V6 TURBO', code: 'V6-TURBO' },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'Jeep',
        models: [
          {
            name: 'Grand Cherokee',
            variants: [
              {
                name: 'Overland',
                engines: [
                  { name: '3.0L 2998CC V6 DIESEL', code: 'V6-DIESEL' },
                  { name: '3.6L 3604CC V6 FI', code: 'V6-FI' },
                  { name: '5.7L 5654CC V8 FI', code: 'V8-FI' },
                ],
              },
              {
                name: 'Limited',
                engines: [
                  { name: '3.6L 3604CC V6 FI', code: 'V6-FI' },
                  { name: '5.7L 5654CC V8 FI', code: 'V8-FI' },
                ],
              },
            ],
          },
          {
            name: 'Wrangler',
            variants: [
              {
                name: 'Rubicon',
                engines: [
                  { name: '3.6L 3604CC V6 FI', code: 'V6-FI' },
                  { name: '2.0L 1995CC I4 TURBO', code: 'I4-TURBO' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    year: '2025',
    makes: [
      {
        name: 'Jeep',
        models: [
          {
            name: 'Grand Cherokee',
            variants: [
              {
                name: 'Overland',
                engines: [
                  { name: '3.0L 2998CC V6 DIESEL', code: 'V6-DIESEL' },
                  { name: '3.6L 3604CC V6 FI', code: 'V6-FI' },
                  { name: '5.7L 5654CC V8 FI', code: 'V8-FI' },
                ],
              },
              {
                name: 'Limited',
                engines: [
                  { name: '3.6L 3604CC V6 FI', code: 'V6-FI' },
                  { name: '5.7L 5654CC V8 FI', code: 'V8-FI' },
                ],
              },
              {
                name: 'Laredo',
                engines: [
                  { name: '3.6L 3604CC V6 FI', code: 'V6-FI' },
                ],
              },
            ],
          },
          {
            name: 'Wrangler',
            variants: [
              {
                name: 'Rubicon',
                engines: [
                  { name: '3.6L 3604CC V6 FI', code: 'V6-FI' },
                  { name: '2.0L 1995CC I4 TURBO', code: 'I4-TURBO' },
                ],
              },
              {
                name: 'Sahara',
                engines: [
                  { name: '3.6L 3604CC V6 FI', code: 'V6-FI' },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'Ford',
        models: [
          {
            name: 'F-150',
            variants: [
              {
                name: 'XLT',
                engines: [
                  { name: '3.5L 3496CC V6 TURBO', code: 'V6-ECOBOOST' },
                  { name: '5.0L 4951CC V8 FI', code: 'V8-FI' },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'Chevrolet',
        models: [
          {
            name: 'Silverado 1500',
            variants: [
              {
                name: 'LT',
                engines: [
                  { name: '5.3L 5328CC V8 FI', code: 'V8-FI' },
                  { name: '6.2L 6162CC V8 FI', code: 'V8-FI' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    year: '2024',
    makes: [
      {
        name: 'Jeep',
        models: [
          {
            name: 'Grand Cherokee',
            variants: [
              {
                name: 'Overland',
                engines: [
                  { name: '3.6L 3604CC V6 FI', code: 'V6-FI' },
                  { name: '5.7L 5654CC V8 FI', code: 'V8-FI' },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'Ford',
        models: [
          {
            name: 'F-150',
            variants: [
              {
                name: 'XLT',
                engines: [
                  { name: '3.5L 3496CC V6 TURBO', code: 'V6-ECOBOOST' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    year: '2023',
    makes: [
      {
        name: 'Jeep',
        models: [
          {
            name: 'Grand Cherokee',
            variants: [
              {
                name: 'Limited',
                engines: [
                  { name: '3.6L 3604CC V6 FI', code: 'V6-FI' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    year: '2022',
    makes: [
      {
        name: 'Jeep',
        models: [
          {
            name: 'Grand Cherokee',
            variants: [
              {
                name: 'Limited',
                engines: [
                  { name: '3.6L 3604CC V6 FI', code: 'V6-FI' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    year: '2021',
    makes: [
      {
        name: 'Jeep',
        models: [
          {
            name: 'Grand Cherokee',
            variants: [
              {
                name: 'Limited',
                engines: [
                  { name: '3.6L 3604CC V6 FI', code: 'V6-FI' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    year: '2020',
    makes: [
      {
        name: 'Jeep',
        models: [
          {
            name: 'Grand Cherokee',
            variants: [
              {
                name: 'Limited',
                engines: [
                  { name: '3.6L 3604CC V6 FI', code: 'V6-FI' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]

/**
 * Get makes available for a specific year
 * @param year - Vehicle year
 * @returns Array of makes for that year
 */
export function getMakesForYear(year: string): VehicleMake[] {
  const yearData = VEHICLE_DATA.find((data) => data.year === year)
  return yearData?.makes || []
}

/**
 * Get models available for a specific year and make
 * @param year - Vehicle year
 * @param make - Vehicle make
 * @returns Array of models for that year and make
 */
export function getModelsForMake(year: string, make: string): VehicleModel[] {
  const yearData = VEHICLE_DATA.find((data) => data.year === year)
  const makeData = yearData?.makes.find((m) => m.name === make)
  return makeData?.models || []
}

/**
 * Get variants available for a specific year, make, and model
 * @param year - Vehicle year
 * @param make - Vehicle make
 * @param model - Vehicle model
 * @returns Array of variants for that year, make, and model
 */
export function getVariantsForModel(
  year: string,
  make: string,
  model: string
): ModelVariant[] {
  const yearData = VEHICLE_DATA.find((data) => data.year === year)
  const makeData = yearData?.makes.find((m) => m.name === make)
  const modelData = makeData?.models.find((m) => m.name === model)
  return modelData?.variants || []
}

/**
 * Get engines available for a specific year, make, model, and variant
 * @param year - Vehicle year
 * @param make - Vehicle make
 * @param model - Vehicle model
 * @param variant - Vehicle variant
 * @returns Array of engines for that configuration
 */
export function getEnginesForVariant(
  year: string,
  make: string,
  model: string,
  variant: string
): EngineOption[] {
  const variants = getVariantsForModel(year, make, model)
  const variantData = variants.find((v) => v.name === variant)
  return variantData?.engines || []
}
