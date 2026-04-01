/**
 * Technical Material Calculation Utilities
 * Specifically tuned for Brick Tile Shop Cladding Tiles
 */

export type Unit = 'm' | 'mm';

export interface ProjectDimensions {
  width: number;
  height: number;
  unit: Unit;
  wastage: number; // percentage
}

export interface EstimationResults {
  totalArea: number;      // sqm
  tileQuantity: number;   // units
  totalMass: number;      // kg
  totalInvestment: number; // ZAR
  formattedArea: string;
  formattedQuantity: string;
  formattedMass: string;
  formattedInvestment: string;
}

// Product Constants (Zambezi Cladding Tile)
const TILE_LENGTH_MM = 220;
const TILE_HEIGHT_MM = 73;
const STANDARD_JOINT_MM = 10;
const WEIGHT_PER_TILE_KG = 0.3;
const PRICE_PER_SQM_ZAR = 275.00;

/**
 * Calculates project requirements based on surface dimensions
 */
export const calculateProjectEstimation = (dims: ProjectDimensions): EstimationResults => {
  const { width, height, unit, wastage } = dims;

  // 1. Normalize to meters
  const factor = unit === 'mm' ? 1000 : 1;
  const widthM = width / factor;
  const heightM = height / factor;
  const areaSqm = widthM * heightM;

  // 2. Calculate effective tile coverage (including joint)
  // Area of one tile + its share of the joint
  const effectiveLengthM = (TILE_LENGTH_MM + STANDARD_JOINT_MM) / 1000;
  const effectiveHeightM = (TILE_HEIGHT_MM + STANDARD_JOINT_MM) / 1000;
  const effectiveTileArea = effectiveLengthM * effectiveHeightM;

  // 3. Calculate quantities
  const baseQuantity = areaSqm / effectiveTileArea;
  const quantityWithWastage = Math.ceil(baseQuantity * (1 + wastage / 100));

  // 4. Calculate logistics and finance
  const totalMass = quantityWithWastage * WEIGHT_PER_TILE_KG;
  const totalInvestment = areaSqm * PRICE_PER_SQM_ZAR;

  return {
    totalArea: areaSqm,
    tileQuantity: quantityWithWastage,
    totalMass: totalMass,
    totalInvestment: totalInvestment,
    formattedArea: areaSqm.toFixed(2),
    formattedQuantity: quantityWithWastage.toLocaleString(),
    formattedMass: totalMass.toFixed(1),
    formattedInvestment: totalInvestment.toLocaleString('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    })
  };
};

export const ESTIMATION_DISCLAIMER = "Estimates are for guidance only. Final quantities should be verified by a professional installer based on site conditions.";
