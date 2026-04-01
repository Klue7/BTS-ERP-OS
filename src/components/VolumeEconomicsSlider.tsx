/**
 * VolumeEconomicsSlider (v2)
 * ──────────────────────────
 * Shows the customer how increasing their order quantity on one delivery
 * load reduces their delivered cost per unit.
 *
 * UOM rules (matches BTS selling units):
 *   Tiles / Paving  → per BOX  (52 tiles = 1 sqm = 1 box)  max 200 boxes
 *   Bricks          → per PALLET (500 bricks)  max 24 pallets (full truck)
 */

import React, { useMemo } from 'react';
import { Truck, Package, TrendingDown, ArrowDown } from 'lucide-react';
import { useVisualLab } from './VisualLabContext';

// ── Constants ────────────────────────────────────────────────────────────────
const RATE_PER_KM    = 12.50;   // ZAR per km (one-way equivalent)
const MIN_DELIVERY   = 650;     // Minimum gate fee for any delivery

// Tiles / paving
export const TILES_PER_BOX  = 52;   // tiles in one box
export const SQM_PER_BOX    = 1;    // 1 sqm coverage
const MAX_BOXES             = 200;  // slider ceiling

// Bricks
export const BRICKS_PER_PALLET = 500;
const MAX_PALLETS              = 24;  // full truck

// Province distance map (one-way km from Gauteng factories)
const PROVINCE_DISTANCES: Record<string, number> = {
  'gauteng':       45,  'north west':    120, 'limpopo':       280,
  'mpumalanga':   210,  'free state':    400, 'kzn':           600,
  'kwazulu-natal': 600, 'northern cape': 800,
  'eastern cape':  950, 'western cape': 1400,
};

function getDistance(province: string): number {
  if (!province) return 50;
  const p = province.toLowerCase();
  for (const [k, v] of Object.entries(PROVINCE_DISTANCES)) {
    if (p.includes(k)) return v;
  }
  return 50;
}

// ── UOM config per category ───────────────────────────────────────────────────
type UOMConfig = {
  unitSingular:  string;
  unitPlural:    string;
  unitsPerUOM:   number;   // individual items per UOM (e.g. 52 tiles, 500 bricks)
  sqmPerUOM:     number;   // area covered by 1 UOM
  palletUOMs:    number;   // how many of this UOM fit on 1 Pallet
  truckUOMs:     number;   // how many UOMs fit on 1 Full Truck (24 Pallets)
  maxUOM:        number;   // slider ceiling
  uomLabel:      string;   // e.g. "Box (52 tiles / 1m²)"
};

const UOM_CONFIG: Record<string, UOMConfig> = {
  'cladding-tiles': {
    unitSingular: 'Box',    unitPlural: 'Boxes',
    unitsPerUOM: TILES_PER_BOX, sqmPerUOM: SQM_PER_BOX,
    palletUOMs: 40, truckUOMs: 960, maxUOM: 960, // 24 pallets * 40 boxes
    uomLabel: 'Box  ·  52 tiles  ·  1 m²',
  },
  'paving': {
    unitSingular: 'Box',    unitPlural: 'Boxes',
    unitsPerUOM: TILES_PER_BOX, sqmPerUOM: SQM_PER_BOX,
    palletUOMs: 40, truckUOMs: 960, maxUOM: 960, // 24 pallets * 40 boxes
    uomLabel: 'Box  ·  52 pavers  ·  1 m²',
  },
  'bricks': {
    unitSingular: 'Pallet', unitPlural: 'Pallets',
    unitsPerUOM: BRICKS_PER_PALLET, sqmPerUOM: 500 / 55, // 55 bricks/sqm -> ~9.09 sqm
    palletUOMs: 1, truckUOMs: 24, maxUOM: 24,   // 24 pallets full truck
    uomLabel: 'Pallet  ·  500 bricks',
  },
  'breeze-blocks': {
    unitSingular: 'Pallet', unitPlural: 'Pallets',
    unitsPerUOM: 100, sqmPerUOM: 4, // 25 blocks / sqm
    palletUOMs: 1, truckUOMs: 24, maxUOM: 24,
    uomLabel: 'Pallet  ·  100 blocks',
  },
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  /** Current UOM qty (boxes or pallets) */
  uomQty:         number;
  setUomQty:      (n: number) => void;
  /** Min UOM qty — derived from calculator, can't go below */
  minUomQty:      number;
  /** Price per individual unit (tile or brick) in ZAR */
  pricePerUnit:   number;
  /** Province string for distance lookup */
  province:       string;
  /** Whether the customer selected delivery (adds delivery cost) */
  isDelivery:     boolean;
  /** Theme classes */
  accentColor:    string;
  textClass:      string;
  bgClass:        string;
  borderClass:    string;
}

export function VolumeEconomicsSlider({
  uomQty, setUomQty, minUomQty,
  pricePerUnit, province, isDelivery,
  accentColor, textClass, bgClass, borderClass,
}: Props) {
  const { activeCategory } = useVisualLab();
  const cfg     = UOM_CONFIG[activeCategory] ?? UOM_CONFIG['cladding-tiles'];
  const isBrick = activeCategory === 'bricks';
  const isBlock = activeCategory === 'breeze-blocks';
  const unitName = isBrick ? 'bricks' : isBlock ? 'blocks' : 'tiles';

  const distance = useMemo(() => getDistance(province), [province]);

  // ── Cost math ────────────────────────────────────────────────────────────────
  const { totalProductR, deliveryR, baseTotalR, totalR, perUOMR, perUnitR, perSqmR, savings, isFullTruck, discountR, discountPct } = useMemo(() => {
    const totalUnits    = uomQty * cfg.unitsPerUOM;
    const totalSqm      = uomQty * cfg.sqmPerUOM;
    let totalProductR   = totalUnits * pricePerUnit;

    const pallets = uomQty / cfg.palletUOMs;
    const isFullTruck = isDelivery && (uomQty >= cfg.truckUOMs);
    let discountPct = 0;

    if (isDelivery) {
      if (isFullTruck) discountPct = 0.025;
    } else {
      if (pallets >= 20)      discountPct = 0.05;
      else if (pallets >= 10) discountPct = 0.025;
    }

    const discountR = totalProductR * discountPct;
    const discountedProductR = totalProductR - discountR;

    // Delivery: flat truck cost (distance-based), split across qty to show decreasing leverage
    const deliveryR = isDelivery
      ? Math.max(distance * RATE_PER_KM, MIN_DELIVERY)
      : 0;

    const baseTotalR = totalProductR + deliveryR;
    const totalR  = discountedProductR + deliveryR;
    const perUOMR = totalR / uomQty;
    const perUnitR = totalR / totalUnits;
    const perSqmR  = totalR / totalSqm;

    // Savings vs minimum (minUomQty) without full truck discount
    const minTotalUnits    = minUomQty * cfg.unitsPerUOM;
    const minTotalProduct  = minTotalUnits * pricePerUnit;
    const minTotal         = minTotalProduct + deliveryR;
    const minPerUnit       = minTotal / minTotalUnits;
    const savings          = uomQty > minUomQty ? ((minPerUnit - perUnitR) / minPerUnit * 100) : 0;

    return { totalProductR, deliveryR, baseTotalR, totalR, perUOMR, perUnitR, perSqmR, savings, isFullTruck, discountR, discountPct };
  }, [uomQty, minUomQty, pricePerUnit, isDelivery, distance, cfg]);

  const fillPct = ((uomQty - minUomQty) / (cfg.maxUOM - minUomQty)) * 100;
  const clampedFill = Math.max(0, Math.min(100, fillPct));

  const fmt = (n: number) =>
    n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-5">

      {/* UOM label */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${borderClass}/25 text-[10px] uppercase tracking-widest`}
        style={{ backgroundColor: `${accentColor}10`, color: accentColor }}>
        <Package size={11} />
        {cfg.uomLabel}
      </div>

      {/* Current order summary */}
      <div className={`p-4 rounded-xl border ${borderClass}/15 bg-white/[0.03] space-y-3`}>
        <p className="text-[9px] text-white/30 uppercase tracking-widest">Your current order</p>
        <div className="flex justify-between items-baseline">
          <span className={`text-3xl font-mono font-bold ${textClass}`}>
            {uomQty} <span className="text-base font-sans font-normal text-white/50">{uomQty === 1 ? cfg.unitSingular : cfg.unitPlural}</span>
          </span>
          <span className="text-white/40 text-sm font-mono">
            {(uomQty * cfg.unitsPerUOM).toLocaleString()} {unitName}{!isBrick && !isBlock && ` · ${uomQty} m²`}
          </span>
        </div>
        {/* Truck Fill Bar / Progress */}
        <div className="pt-2">
          <div className="flex justify-between text-[9px] text-white/40 mb-1.5 font-mono">
            <span>
              {(isBrick || isBlock) ? `${uomQty} Pallets` : `${uomQty} Boxes (${Math.floor(uomQty/cfg.palletUOMs)} Pallets)`} loaded
            </span>
            {discountPct > 0 ? (
              <span className={textClass}>
                {isDelivery ? `Full Truck + ` : `Bulk Volume + `}
                {discountPct * 100}% Discount
              </span>
            ) : (
              <span>{Math.round(uomQty / cfg.truckUOMs * 100)}% of truck load</span>
            )}
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden flex relative">
            <div className="h-full rounded-full transition-all duration-500 relative z-10"
              style={{ width: `${clampedFill}%`, backgroundColor: accentColor }}>
                {discountPct > 0 && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
              </div>
          </div>
          <div className="flex justify-between text-[9px] text-white/20 mt-1.5 font-mono">
            <span>{minUomQty} Min</span>
            {isDelivery && <Truck size={12} className="text-white/20" />}
            <span>Full load ({cfg.truckUOMs} {cfg.unitPlural})</span>
          </div>
        </div>
      </div>

      {/* Slider — quantity */}
      <div>
        <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-white/35 mb-2 px-0.5">
          <span>
            {minUomQty} {minUomQty === 1 ? cfg.unitSingular : cfg.unitPlural}
            {minUomQty > 1 && <span className="text-white/20 ml-1 normal-case">(your calc)</span>}
          </span>
          <span>{cfg.maxUOM} {cfg.unitPlural}</span>
        </div>
        <input
          type="range"
          min={minUomQty}
          max={cfg.maxUOM}
          step={1}
          value={uomQty}
          onChange={e => setUomQty(parseInt(e.target.value))}
          className="w-full h-2.5 rounded-full appearance-none cursor-pointer outline-none"
          style={{
            background: `linear-gradient(to right, ${accentColor} ${clampedFill}%, rgba(255,255,255,0.1) ${clampedFill}%)`,
          }}
        />
      </div>

      {/* Cost breakdown cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Product & Delivery Column */}
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/5">
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-[9px] text-white/30 uppercase tracking-widest">Product</p>
              {discountPct > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-bold">-{discountPct * 100}%</span>}
            </div>
            <p className="text-white font-mono font-bold text-lg leading-none">
              <span className="text-xs font-normal text-white/30 mr-0.5">R</span>
              {Math.round(totalProductR - discountR).toLocaleString()}
            </p>
            {discountPct > 0 && <p className="text-[9px] mt-1 text-white/20 line-through">R {Math.round(totalProductR).toLocaleString()}</p>}
          </div>
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/5">
            <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Truck size={9} /> Delivery (Flat)
            </p>
            <p className="text-white font-mono font-bold text-lg leading-none">
              {isDelivery
                ? <><span className="text-xs font-normal text-white/30 mr-0.5">R</span>{Math.round(deliveryR).toLocaleString()}</>
                : <span className="text-white/20 text-xs text-sans">Collection</span>
              }
            </p>
          </div>
        </div>

        {/* Breakdown Column */}
        <div className={`p-4 flex flex-col justify-center rounded-xl border ${borderClass}/30`} style={{ backgroundColor: `${accentColor}0A` }}>
          <p className="text-[9px] text-white/30 uppercase tracking-widest mb-3 text-center opacity-80 border-b border-white/5 pb-2">
            {isDelivery ? 'Delivered Rates' : 'Collected Rates'}
          </p>
          
          <div className="space-y-4">
            <div className="flex justify-between items-baseline px-1">
              <span className="text-[10px] text-white/50 uppercase tracking-widest">Per {isBrick ? 'Brick' : isBlock ? 'Block' : 'Tile'}</span>
              <span className={`${textClass} font-mono font-bold text-lg leading-none`}>
                <span className="text-xs font-sans font-normal opacity-50 mr-0.5">R</span>{fmt(perUnitR)}
              </span>
            </div>
            
            <div className="flex justify-between items-baseline px-1">
              <span className="text-[10px] text-white/50 uppercase tracking-widest">Per m²</span>
              <span className={`${textClass} font-mono font-bold text-lg leading-none`}>
                <span className="text-xs font-sans font-normal opacity-50 mr-0.5">R</span>{fmt(perSqmR)}
              </span>
            </div>

            <div className="flex justify-between items-baseline px-1 pt-3 border-t border-white/5">
              <span className="text-[10px] text-white/50 uppercase tracking-widest">Per {cfg.unitSingular}</span>
              <span className={`text-white font-mono font-bold text-[15px] leading-none`}>
                <span className="text-xs font-sans font-normal opacity-50 mr-0.5">R</span>{fmt(perUOMR)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Total line */}
      <div className={`flex justify-between items-center px-5 py-4 rounded-xl border ${borderClass}/25`}
        style={{ backgroundColor: `${accentColor}1A` }}>
        <span className="text-white text-xs uppercase tracking-widest font-bold">
          Total {isDelivery ? 'Delivered' : 'Collected'}
        </span>
        <div className="text-right flex items-center gap-3">
          {discountPct > 0 && (
            <span className="text-[11px] text-white/30 uppercase tracking-widest">
              inc R{Math.round(discountR).toLocaleString()} off
            </span>
          )}
          <span className="text-white font-mono font-bold text-2xl">
            <span className="text-sm text-white/40 mr-1.5">R</span>{Math.round(totalR).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Savings callout — only shows when qty > minimum */}
      {savings > 0.5 && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="p-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }}>
            <TrendingDown size={12} style={{ color: '#000' }} />
          </div>
          <p className="text-[11px] leading-relaxed text-white/50">
            <strong className={`${textClass}`}>+{Math.round(uomQty - minUomQty)} {cfg.unitPlural} extra</strong>
            {' '}saves you{' '}
            <strong className={`${textClass}`}>R {fmt(perUnitR * (uomQty - minUomQty) * cfg.unitsPerUOM)}</strong>
            {' '}vs minimum order — {savings.toFixed(1)}% cheaper per {isBrick ? 'brick' : isBlock ? 'block' : 'tile'}.
          </p>
        </div>
      )}

      {/* Delivery efficiency helper */}
      {isDelivery && uomQty < cfg.truckUOMs && (
        <div className="flex items-start gap-2 text-[10px] text-white/30 px-1">
          <ArrowDown size={11} className={`shrink-0 mt-0.5 ${textClass}`} />
          <span>
            <strong className="text-white/50">Load the truck:</strong> Add {cfg.truckUOMs - uomQty} more {cfg.unitPlural} to fill the truck {' '}
            ({(isBrick || isBlock) ? '24 Pallets' : '960 Boxes / 24 Pallets'}). 
            Delivery fee stays flat, unit prices drop, and you unlock a <strong className="text-white/50">2.5% discount</strong>.
          </span>
        </div>
      )}

      {/* Collection efficiency helper */}
      {!isDelivery && (uomQty / cfg.palletUOMs) < 20 && (
        <div className="flex items-start gap-2 text-[10px] text-white/30 px-1">
          <ArrowDown size={11} className={`shrink-0 mt-0.5 ${textClass}`} />
          <span>
            <strong className="text-white/50">Bulk Collection:</strong> Get a <strong className="text-white/50">2.5% discount</strong> at 10 Pallets, and a <strong className="text-white/50">5% discount</strong> at 20 Pallets.
          </span>
        </div>
      )}

      {/* Companion Products Link — Only shows if we have space in the truck */}
      {isDelivery && uomQty < cfg.truckUOMs && (
        <button className="w-full mt-6 py-5 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-4 group hover:border-white/30 hover:bg-white/[0.02] transition-all">
           <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-colors border border-white/5 group-hover:scale-110">
              <Package size={14} />
           </div>
           <div className="text-left">
              <span className="text-[10px] block font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Add Factory Companions</span>
              <span className="text-[8px] block uppercase tracking-widest text-white/20">Fill remaining truck capacity</span>
           </div>
        </button>
      )}

    </div>
  );
}
