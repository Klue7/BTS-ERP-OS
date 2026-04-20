import React, { useMemo } from 'react';
import { ArrowDown, Package, TrendingDown, Truck } from 'lucide-react';
import {
  calculateQuoteBreakdown,
  formatZar,
  getPieceLabel,
  getPricingUnitLabel,
  type ProductQuoteModel,
  type QuoteQuantityUnit,
} from '../pricing/quoteEngine';

interface Props {
  product: ProductQuoteModel;
  uomQty: number;
  setUomQty: (n: number) => void;
  minUomQty: number;
  quantityUnit?: QuoteQuantityUnit;
  province: string;
  isDelivery: boolean;
  accentColor: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
}

export function VolumeEconomicsSlider({
  product,
  uomQty,
  setUomQty,
  minUomQty,
  quantityUnit,
  province,
  isDelivery,
  accentColor,
  textClass,
  bgClass,
  borderClass,
}: Props) {
  const quote = useMemo(
    () =>
      calculateQuoteBreakdown({
        product,
        quantity: uomQty,
        minimumQuantity: minUomQty,
        quantityUnit,
        province,
        isDelivery,
      }),
    [isDelivery, minUomQty, product, province, quantityUnit, uomQty],
  );

  const maxQuantity = useMemo(() => {
    if (quote.quoteUnit === 'm2') {
      return Math.max(quote.minimumQuoteUnitQuantity, Math.ceil(quote.rates.sqmPerTruck));
    }
    if (quote.quoteUnit === 'box') {
      return Math.max(quote.minimumQuoteUnitQuantity, Math.ceil(quote.rates.boxesPerTruck));
    }
    if (quote.quoteUnit === 'piece') {
      return Math.max(quote.minimumQuoteUnitQuantity, quote.rates.piecesPerTruck);
    }
    return Math.max(quote.minimumQuoteUnitQuantity, product.palletsPerTruck);
  }, [product.palletsPerTruck, quote.minimumQuoteUnitQuantity, quote.quoteUnit, quote.rates.boxesPerTruck, quote.rates.piecesPerTruck, quote.rates.sqmPerTruck]);

  const quantityLabel = getPricingUnitLabel(quote.quoteUnit, product.categoryKey, quote.quoteUnitQuantity);
  const minimumLabel = getPricingUnitLabel(quote.quoteUnit, product.categoryKey, quote.minimumQuoteUnitQuantity);
  const pieceLabel = getPieceLabel(product.categoryKey);
  const truckFillPercent = Math.max(0, Math.min(100, (quote.pallets / product.palletsPerTruck) * 100));

  return (
    <div className="space-y-5">
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-widest ${borderClass}/25`}
        style={{ backgroundColor: `${accentColor}10`, color: accentColor }}
      >
        <Package size={11} />
        {formatZar(product.sellPriceZar)} / {getPricingUnitLabel(product.pricingUnit, product.categoryKey, 1)}
      </div>

      <div className={`space-y-3 rounded-xl border ${borderClass}/15 bg-white/[0.03] p-4`}>
        <p className="text-[9px] uppercase tracking-widest text-white/30">Your current order</p>
        <div className="flex justify-between items-baseline">
          <span className={`font-mono text-3xl font-bold ${textClass}`}>
            {quote.quoteUnit === 'm2' ? quote.quoteUnitQuantity.toFixed(0) : quote.quoteUnitQuantity}
            <span className="ml-2 text-base font-normal text-white/50">{quantityLabel}</span>
          </span>
          <span className="text-right text-sm font-mono text-white/40">
            {quote.pieces.toLocaleString()} {quote.pieces === 1 ? pieceLabel : `${pieceLabel}s`} · {quote.sqm.toFixed(2)} m²{product.categoryKey === 'cladding-tiles' ? ` · ${quote.boxes.toFixed(2)} boxes` : ''} · {quote.pallets.toFixed(2)} pallets
          </span>
        </div>

        <div className="pt-2">
          <div className="mb-1.5 flex justify-between text-[9px] font-mono text-white/40">
            <span>{quote.pallets.toFixed(2)} pallets loaded</span>
            {quote.discountPercent > 0 ? (
              <span className={textClass}>
                {isDelivery ? 'Full Truck' : 'Bulk Volume'} + {quote.discountPercent}% Discount
              </span>
            ) : (
              <span>{Math.round(truckFillPercent)}% of truck load</span>
            )}
          </div>
          <div className="relative flex h-2 overflow-hidden rounded-full bg-white/5">
            <div className="relative z-10 h-full rounded-full transition-all duration-500" style={{ width: `${truckFillPercent}%`, backgroundColor: accentColor }}>
              {quote.discountPercent > 0 ? <div className="absolute inset-0 animate-pulse bg-white/20" /> : null}
            </div>
          </div>
          <div className="mt-1.5 flex justify-between text-[9px] font-mono text-white/20">
            <span>{quote.minimumQuoteUnitQuantity} {minimumLabel}</span>
            {isDelivery ? <Truck size={12} className="text-white/20" /> : null}
            <span>Full load ({product.palletsPerTruck} pallets)</span>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex justify-between px-0.5 text-[10px] font-mono uppercase tracking-widest text-white/35">
          <span>{quote.minimumQuoteUnitQuantity} {minimumLabel}</span>
          <span>{maxQuantity} {getPricingUnitLabel(quote.quoteUnit, product.categoryKey, maxQuantity)}</span>
        </div>
        <input
          type="range"
          min={quote.minimumQuoteUnitQuantity}
          max={maxQuantity}
          step={1}
          value={quote.quoteUnitQuantity}
          onChange={(e) => setUomQty(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10"
          style={{ accentColor }}
        />
      </div>

      <div className={`grid grid-cols-2 gap-3 ${product.categoryKey === 'cladding-tiles' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
        {[
          { label: `Delivered / ${pieceLabel}`, value: formatZar(quote.pricePerPieceDeliveredZar) },
          { label: 'Delivered / m²', value: formatZar(quote.pricePerSqmDeliveredZar) },
          ...(product.categoryKey === 'cladding-tiles' ? [{ label: 'Delivered / box', value: formatZar(quote.pricePerBoxDeliveredZar) }] : []),
          { label: 'Delivered / pallet', value: formatZar(quote.pricePerPalletDeliveredZar) },
          { label: 'Order weight', value: `${quote.orderWeightKg.toLocaleString('en-ZA', { maximumFractionDigits: 1 })} kg` },
        ].map((metric) => (
          <div key={metric.label} className={`rounded-xl border ${borderClass}/10 bg-black/20 p-4`}>
            <div className="text-[9px] uppercase tracking-widest text-white/30">{metric.label}</div>
            <div className={`mt-2 text-sm font-bold ${textClass}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl border ${borderClass}/15 bg-white/[0.03] p-5`}>
        <div className="mb-4 flex items-center gap-2">
          <TrendingDown size={14} className={textClass} />
          <span className="text-[10px] uppercase tracking-widest text-white/30">Cost Breakdown</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-white/35">Product total</div>
            <div className="mt-1 font-mono text-white">{formatZar(quote.productTotalZar)}</div>
          </div>
          <div>
            <div className="text-white/35">{isDelivery ? 'Transport total' : 'Collection'}</div>
            <div className="mt-1 font-mono text-white">{formatZar(quote.deliveryTotalZar)}</div>
          </div>
          <div>
            <div className="text-white/35">Trip basis</div>
            <div className="mt-1 font-mono text-white">{quote.distanceKm.toFixed(0)} km route</div>
          </div>
          <div>
            <div className="text-white/35">Order total</div>
            <div className={`mt-1 font-mono font-bold ${textClass}`}>{formatZar(quote.totalZar)}</div>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border ${borderClass}/15 bg-white/[0.03] p-4`}>
        <div className="flex items-start gap-3">
          <div className={`rounded-full p-2 ${bgClass}/10`}>
            <ArrowDown size={14} className={textClass} />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-white/30">Volume leverage</div>
            <p className="text-sm leading-relaxed text-white/55">
              The same <strong className={textClass}>{quote.distanceKm.toFixed(0)} km</strong> trip costs <strong className={textClass}>{formatZar(quote.deliveryTotalZar)}</strong>{' '}
              whether you take the minimum order or fill more of the truck. Adding <strong className={textClass}>{Math.max(0, quote.quoteUnitQuantity - quote.minimumQuoteUnitQuantity)} {getPricingUnitLabel(quote.quoteUnit, product.categoryKey, 2)}</strong>{' '}
              spreads that route cost down to <strong className={textClass}>{formatZar(quote.pricePerPieceDeliveredZar)} / {pieceLabel}</strong>{' '}
              and <strong className={textClass}>{formatZar(quote.pricePerSqmDeliveredZar)} / m²</strong>.
            </p>
            {quote.savingsPercent > 0 ? (
              <p className="text-xs text-white/35">
                Deterministic delivered-rate saving vs the minimum order on the same route: <strong className={textClass}>{quote.savingsPercent.toFixed(2)}%</strong>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
