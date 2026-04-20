import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Building2, CheckCircle2, Download, MapPin } from 'lucide-react';
import {
  calculateQuoteBreakdown,
  formatZar,
  getPieceLabel,
  getPricingUnitLabel,
  type ProductQuoteModel,
  type QuoteQuantityUnit,
} from '../pricing/quoteEngine';

const btsQuoteLogoUrl = new URL('../Public/logo high res/Brick Tile Shop Logo 2022.png', import.meta.url).href;
const quoteBankingPreview = {
  accountName: 'Brick Tile Shop',
  bankName: 'Configured on generated PDF',
  accountNumber: 'Set BTS_BANK_ACCOUNT_NUMBER in .env',
  branchCode: 'Set BTS_BANK_BRANCH_CODE in .env',
  reference: 'Use the quote number as EFT reference',
};

interface QuoteProps {
  contact: { name: string; email: string; phone: string; company?: string };
  address: { street: string; city: string; province: string; code: string };
  fulfillment: string;
  uomQty?: number;
  quantityUnit?: QuoteQuantityUnit;
  itemName?: string;
  product?: ProductQuoteModel | null;
  pricePerUnit?: number;
  isBrick?: boolean;
  activeColor: string;
  cartItems?: Array<{
    id: string;
    name: string;
    category: 'cladding-tiles' | 'bricks' | 'paving' | 'breeze-blocks';
    rawQty: number;
    uomQty: number;
    pricePerUnit: number;
    quantityUnit?: QuoteQuantityUnit;
    quoteModel?: ProductQuoteModel;
  }>;
  onClose: () => void;
}

function buildFallbackProduct(itemName: string, pricePerUnit: number, isBrick: boolean): ProductQuoteModel {
  return {
    name: itemName,
    categoryKey: isBrick ? 'bricks' : 'cladding-tiles',
    pricingUnit: isBrick ? 'piece' : 'm2',
    sellPriceZar: pricePerUnit,
    unitsPerM2: isBrick ? 55 : 50,
    weightPerPieceKg: isBrick ? 3.1 : 0.3,
    piecesPerPallet: isBrick ? 500 : 2000,
    boxesPerPallet: isBrick ? 0 : 40,
    palletsPerTruck: 24,
    logistics: {
      costPricePerKm: 25,
      sellPricePerKm: 35,
      fixedFee: 0,
      minimumCharge: 0,
    },
  };
}

export function QuoteDocument({
  contact,
  address,
  fulfillment,
  uomQty = 1,
  quantityUnit,
  itemName = '',
  product,
  pricePerUnit = 0,
  isBrick = false,
  activeColor,
  cartItems,
  onClose,
}: QuoteProps) {
  const isDelivery = fulfillment === 'delivery';
  const activeProduct = product ?? buildFallbackProduct(itemName, pricePerUnit, isBrick);

  const singleQuote = useMemo(
    () =>
      calculateQuoteBreakdown({
        product: activeProduct,
        quantity: uomQty,
        quantityUnit,
        minimumQuantity: 1,
        province: address?.province ?? '',
        isDelivery,
      }),
    [activeProduct, address?.province, isDelivery, quantityUnit, uomQty],
  );

  const cartSummary = useMemo(() => {
    if (!cartItems?.length) return null;

    const lines = cartItems.map((item) => {
      const fallbackProduct = buildFallbackProduct(item.name, item.pricePerUnit, item.category === 'bricks');
      const lineProduct = item.quoteModel ?? fallbackProduct;
      const lineQuantityUnit =
        item.quantityUnit ?? (item.category === 'bricks' ? 'pallet' : item.category === 'cladding-tiles' ? 'm2' : 'piece');
      const lineQuote = calculateQuoteBreakdown({
        product: lineProduct,
        quantity: item.uomQty,
        quantityUnit: lineQuantityUnit,
        minimumQuantity: 1,
        province: address?.province ?? '',
        isDelivery,
      });

      return {
        ...item,
        lineProduct,
        lineQuantityUnit,
        lineQuote,
      };
    });

    const productTotalZar = lines.reduce((total, line) => total + line.lineQuote.productTotalZar, 0);
    const deliveryTotalZar = lines.reduce((total, line) => total + line.lineQuote.deliveryTotalZar, 0);
    const totalPieces = lines.reduce((total, line) => total + line.lineQuote.pieces, 0);
    const totalPallets = lines.reduce((total, line) => total + line.lineQuote.pallets, 0);
    const totalZar = productTotalZar + deliveryTotalZar;

    return {
      lines,
      productTotalZar,
      discountZar: 0,
      discountPercent: 0,
      deliveryTotalZar,
      totalZar,
      totalPieces,
      totalPallets,
    };
  }, [address?.province, cartItems, isDelivery]);

  const totals = cartSummary ?? {
    productTotalZar: singleQuote.productTotalZar,
    discountZar: singleQuote.discountZar,
    discountPercent: singleQuote.discountPercent,
    deliveryTotalZar: singleQuote.deliveryTotalZar,
    totalZar: singleQuote.totalZar,
  };

  const date = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  const quoteNo = `QT-${Math.floor(100000 + Math.random() * 900000)}`;
  const pieceLabel = getPieceLabel(activeProduct.categoryKey);
  const quoteUnitLabel = getPricingUnitLabel(singleQuote.quoteUnit, activeProduct.categoryKey, singleQuote.quoteUnitQuantity);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black/80 p-4 backdrop-blur-xl sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white text-black shadow-[0_0_80px_rgba(0,0,0,0.5)] sm:rounded-3xl"
      >
        <div className="flex-1 overflow-y-auto px-6 py-8 sm:p-10">
          <div className="mb-6 flex items-start justify-between border-b border-gray-200 pb-6">
            <div>
              <img src={btsQuoteLogoUrl} alt="Brick Tile Shop" className="h-14 w-auto object-contain" />
              <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-400">Official Proforma Quote</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{quoteNo}</p>
              <p className="mt-1 text-xs text-gray-400">Date: {date}</p>
              <p className="text-xs text-gray-400">Valid: 7 Days</p>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-8">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <Building2 size={12} /> Billed To
              </p>
              <p className="text-sm font-bold text-gray-900">{contact.name}</p>
              {contact.company ? <p className="text-sm text-gray-600">{contact.company}</p> : null}
              <p className="text-sm text-gray-600">{contact.email}</p>
              <p className="text-sm text-gray-600">{contact.phone}</p>
            </div>
            {isDelivery ? (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <MapPin size={12} /> Delivery Address
                </p>
                <p className="text-sm text-gray-600">{address.street || 'Pending Street'}</p>
                <p className="text-sm text-gray-600">{address.city || 'Pending City'}</p>
                <p className="text-sm text-gray-600">{address.province}</p>
                <p className="text-sm text-gray-600">{address.code}</p>
              </div>
            ) : null}
          </div>

          <div className="mb-6 overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-left">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Item Description</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-500">Qty</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cartSummary?.lines?.length ? (
                  cartSummary.lines.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-gray-900">{item.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {item.lineQuote.pieces.toLocaleString()} {item.lineQuote.pieces === 1 ? getPieceLabel(item.lineProduct.categoryKey) : `${getPieceLabel(item.lineProduct.categoryKey)}s`}
                          {' '}· {item.lineQuote.sqm.toFixed(2)} m² · {item.lineQuote.pallets.toFixed(2)} pallets
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-bold text-gray-900">{item.uomQty}</p>
                        <p className="text-[10px] uppercase text-gray-500">{getPricingUnitLabel(item.lineQuantityUnit, item.lineProduct.categoryKey, item.uomQty)}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-bold text-gray-900">{formatZar(item.lineQuote.productTotalZar)}</p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-gray-900">{activeProduct.name || itemName}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {singleQuote.pieces.toLocaleString()} {singleQuote.pieces === 1 ? pieceLabel : `${pieceLabel}s`} · {singleQuote.sqm.toFixed(2)} m² · {singleQuote.pallets.toFixed(2)} pallets
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-sm font-bold text-gray-900">{singleQuote.quoteUnitQuantity}</p>
                      <p className="text-[10px] uppercase text-gray-500">{quoteUnitLabel}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-sm font-bold text-gray-900">{formatZar(singleQuote.productTotalZar)}</p>
                    </td>
                  </tr>
                )}
                {totals.discountZar > 0 ? (
                  <tr className="bg-green-50/50">
                    <td className="px-4 py-3" colSpan={2}>
                      <p className="flex items-center gap-1.5 text-xs font-bold text-green-700">
                        <AlertCircle size={12} /> Volume Bulk Discount Applied
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-bold text-green-700">- {formatZar(totals.discountZar)}</p>
                    </td>
                  </tr>
                ) : null}
                <tr>
                  <td className="px-4 py-4" colSpan={2}>
                    <p className="text-sm font-bold text-gray-900">Logistics: {isDelivery ? 'Direct to Site Delivery' : 'Collection'}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {isDelivery ? 'Rate-card delivery from supplier origin' : 'Customer collection from supplier origin'}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className="text-sm font-bold text-gray-900">{formatZar(totals.deliveryTotalZar)}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {!cartItems?.length ? (
            <div className="mb-8 grid grid-cols-2 gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400">Stored price</div>
                <div className="mt-1 font-bold text-gray-900">{formatZar(activeProduct.sellPriceZar)} / {getPricingUnitLabel(activeProduct.pricingUnit, activeProduct.categoryKey, 1)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400">Delivered rate</div>
                <div className="mt-1 font-bold text-gray-900">
                  {formatZar(
                    singleQuote.quoteUnit === 'pallet'
                      ? singleQuote.pricePerPalletDeliveredZar
                      : singleQuote.quoteUnit === 'piece'
                        ? singleQuote.pricePerPieceDeliveredZar
                        : singleQuote.quoteUnit === 'box'
                          ? singleQuote.pricePerBoxDeliveredZar
                          : singleQuote.pricePerSqmDeliveredZar,
                  )} / {getPricingUnitLabel(singleQuote.quoteUnit, activeProduct.categoryKey, 1)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400">Weight</div>
                <div className="mt-1 font-bold text-gray-900">{singleQuote.orderWeightKg.toLocaleString('en-ZA', { maximumFractionDigits: 1 })} kg</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400">Truck fill</div>
                <div className="mt-1 font-bold text-gray-900">{((singleQuote.pallets / activeProduct.palletsPerTruck) * 100).toFixed(1)}%</div>
              </div>
            </div>
          ) : null}

          <div className="mb-8 flex justify-end">
            <div className="w-1/2 min-w-[240px]">
              <div className="flex items-center justify-between border-b border-gray-100 py-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Subtotal (Ex. VAT)</span>
                <span className="text-sm font-bold text-gray-900">{formatZar(totals.totalZar / 1.15)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 py-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">VAT (15%)</span>
                <span className="text-sm font-bold text-gray-900">{formatZar(totals.totalZar - (totals.totalZar / 1.15))}</span>
              </div>
              <div className="my-2 -mx-4 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-4">
                <span className="text-sm font-black uppercase tracking-widest text-gray-900">Total Due</span>
                <span className="text-2xl font-black text-gray-900">{formatZar(totals.totalZar)}</span>
              </div>
            </div>
          </div>

          <p className="mx-auto max-w-md text-center text-[10px] leading-relaxed text-gray-400">
            Payment is required in full to dispatch the supplier procurement order. Quote values are snapshotted from the stored product conversion and logistics data at generation time.
          </p>

          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">EFT Payment Details</p>
                <p className="mt-1 text-xs text-gray-500">The generated PDF uses the production banking details configured in the server environment.</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-700">Bank Transfer</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-[9px] uppercase tracking-widest text-gray-400">Account Name</div>
                <div className="mt-1 font-bold text-gray-900">{quoteBankingPreview.accountName}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-gray-400">Bank</div>
                <div className="mt-1 font-bold text-gray-900">{quoteBankingPreview.bankName}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-gray-400">Account Number</div>
                <div className="mt-1 font-bold text-gray-900">{quoteBankingPreview.accountNumber}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-gray-400">Branch Code</div>
                <div className="mt-1 font-bold text-gray-900">{quoteBankingPreview.branchCode}</div>
              </div>
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-emerald-700">{quoteBankingPreview.reference}: {quoteNo}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 p-4 sm:flex-row sm:px-10 sm:py-6">
          <button onClick={onClose} className="text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900">
            Cancel
          </button>
          <div className="flex w-full gap-3 sm:w-auto">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-900 shadow-sm transition-colors hover:bg-gray-50 sm:flex-none">
              <Download size={14} /> PDF
            </button>
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-8 py-4 text-xs font-bold uppercase tracking-widest text-black shadow-lg transition-transform hover:scale-105 active:scale-95 sm:flex-none"
              style={{ backgroundColor: activeColor }}
            >
              Confirm &amp; Pay <CheckCircle2 size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
