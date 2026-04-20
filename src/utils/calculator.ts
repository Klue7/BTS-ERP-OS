import type { ProductQuoteModel, QuoteEstimationInput, QuoteEstimationResult } from '../pricing/quoteEngine';
import { calculateDeterministicProjectEstimation } from '../pricing/quoteEngine';

export type Unit = QuoteEstimationInput['unit'];

export interface ProjectDimensions extends QuoteEstimationInput {}

export type EstimationResults = QuoteEstimationResult;

export const calculateProjectEstimation = (product: ProductQuoteModel, dims: ProjectDimensions): EstimationResults =>
  calculateDeterministicProjectEstimation(product, dims);

export const ESTIMATION_DISCLAIMER =
  'Estimates are derived from the stored product dimensions, packaging, and pricing factors. Final quantities should still be verified against site conditions.';
