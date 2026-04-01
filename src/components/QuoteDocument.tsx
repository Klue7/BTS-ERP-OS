import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Download, FileText, CheckCircle2, Building2, MapPin, Package, AlertCircle } from 'lucide-react';
import { TILES_PER_BOX, SQM_PER_BOX, BRICKS_PER_PALLET } from './VolumeEconomicsSlider';

interface QuoteProps {
  contact: { name: string; email: string; phone: string; company?: string };
  address: { street: string; city: string; province: string; code: string };
  fulfillment: string;
  uomQty?: number;
  itemName?: string;
  pricePerUnit?: number; // raw price per tile/brick
  isBrick?: boolean;
  activeColor: string;
  cartItems?: any[];
  onClose: () => void;
}

export function QuoteDocument({
  contact, address, fulfillment, uomQty = 1, itemName = '', pricePerUnit = 0, isBrick = false, activeColor, cartItems, onClose
}: QuoteProps) {
  
  const isDelivery = fulfillment === 'delivery';

  // Quick re-calc exactly matching VolumeEconomicsSlider
  const { totalR, subTotalR, deliveryR, discountR } = useMemo(() => {
    let rawTotalProduct = 0;
    let totalPallets = 0;

    if (cartItems && cartItems.length > 0) {
      cartItems.forEach(item => {
        const _unitsPerUOM = item.category === 'bricks' ? BRICKS_PER_PALLET : TILES_PER_BOX;
        const _palletUOMs = item.category === 'bricks' ? 1 : 40;
        const totalUnits = item.uomQty * _unitsPerUOM;
        rawTotalProduct += (item.rawQty || totalUnits) * item.pricePerUnit;
        totalPallets += (item.uomQty / _palletUOMs);
      });
    } else {
      const unitsPerUOM = isBrick ? BRICKS_PER_PALLET : TILES_PER_BOX;
      const palletUOMs = isBrick ? 1 : 40;
      const totalUnits = uomQty * unitsPerUOM;
      rawTotalProduct = totalUnits * pricePerUnit;
      totalPallets = uomQty / palletUOMs;
    }

    const isFullTruck = isDelivery && (totalPallets >= 24);
    let discountPct = 0;

    if (isDelivery) {
      if (isFullTruck) discountPct = 0.025;
    } else {
      if (totalPallets >= 20)      discountPct = 0.05;
      else if (totalPallets >= 10) discountPct = 0.025;
    }

    const discountR = rawTotalProduct * discountPct;
    const subTotalR = rawTotalProduct - discountR;

    // Delivery mockup math
    let dist = 50;
    const p = address?.province?.toLowerCase() || '';
    if (p.includes('western')) dist = 1400;
    else if (p.includes('kwazulu') || p.includes('kzn')) dist = 600;
    else if (p.includes('limpopo')) dist = 280;
    else if (p.includes('mpumalanga')) dist = 210;

    const deliveryR = isDelivery ? Math.max(dist * 12.50, 650) : 0;
    const totalR = subTotalR + deliveryR;

    return { totalR, subTotalR, deliveryR, discountR, rawTotalProduct };
  }, [uomQty, pricePerUnit, isDelivery, isBrick, address, cartItems]);

  const date = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  const quoteNo = `QT-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] w-full max-w-2xl text-black relative flex flex-col max-h-[90vh]"
      >
        {/* Scrollable Document Body */}
        <div className="flex-1 overflow-y-auto px-6 py-8 sm:p-10">
        
        {/* Header Ribbon */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase text-gray-900">BRICK <span style={{ color: activeColor }}>&amp;</span> TILE</h2>
            <p className="text-gray-400 text-[10px] tracking-widest uppercase mt-1">Official Proforma Quote</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">{quoteNo}</p>
            <p className="text-xs text-gray-400 mt-1">Date: {date}</p>
            <p className="text-xs text-gray-400">Valid: 7 Days</p>
          </div>
        </div>

        {/* Customer & Bill To */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5">
              <Building2 size={12} /> Billed To
            </p>
            <p className="text-sm font-bold text-gray-900">{contact.name}</p>
            {contact.company && <p className="text-sm text-gray-600">{contact.company}</p>}
            <p className="text-sm text-gray-600">{contact.email}</p>
            <p className="text-sm text-gray-600">{contact.phone}</p>
          </div>
          {isDelivery && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5">
                <MapPin size={12} /> Delivery Address
              </p>
              <p className="text-sm text-gray-600">{address.street || 'Pending Street'}</p>
              <p className="text-sm text-gray-600">{address.city || 'Pending City'}</p>
              <p className="text-sm text-gray-600">{address.province}</p>
              <p className="text-sm text-gray-600">{address.code}</p>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Item Description</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-right">Qty</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Product(s) */}
              {cartItems && cartItems.length > 0 ? (
                cartItems.map((ci, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-4">
                      <p className="font-bold text-gray-900 text-sm">{ci.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Premium Quality • {ci.category === 'bricks' ? 'SABS Approved' : '1st Grade'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-sm font-bold text-gray-900">{ci.uomQty}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{ci.category === 'bricks' ? 'Pallets' : 'Boxes'}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-sm font-bold text-gray-900">R {(ci.rawQty * ci.pricePerUnit).toLocaleString()}</p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-4">
                    <p className="font-bold text-gray-900 text-sm">{itemName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Premium Quality • {isBrick ? 'SABS Approved' : '1st Grade'}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className="text-sm font-bold text-gray-900">{uomQty}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{isBrick ? 'Pallets' : 'Boxes'}</p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className="text-sm font-bold text-gray-900">R {(subTotalR + discountR).toLocaleString()}</p>
                  </td>
                </tr>
              )}
              {/* Volume Discount */}
              {discountR > 0 && (
                <tr className="bg-green-50/50">
                  <td className="px-4 py-3" colSpan={2}>
                    <p className="text-xs font-bold text-green-700 flex items-center gap-1.5">
                      <AlertCircle size={12} /> Volume Bulk Discount Applied
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-bold text-green-700">- R {Math.round(discountR).toLocaleString()}</p>
                  </td>
                </tr>
              )}
              {/* Logistics */}
              <tr>
                <td className="px-4 py-4" colSpan={2}>
                  <p className="font-bold text-gray-900 text-sm">Logistics: {isDelivery ? 'Direct to Site Delivery' : 'Factory Collection'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isDelivery ? 'Flat rate truck delivery' : 'Customer to collect at depot'}
                  </p>
                </td>
                <td className="px-4 py-4 text-right">
                  <p className="text-sm font-bold text-gray-900">R {Math.round(deliveryR).toLocaleString()}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-1/2 min-w-[240px]">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Subtotal (Ex. VAT)</span>
              <span className="text-sm font-bold text-gray-900">R {Math.round(totalR / 1.15).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">VAT (15%)</span>
              <span className="text-sm font-bold text-gray-900">R {Math.round(totalR - (totalR / 1.15)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-4 bg-gray-50 px-4 -mx-4 mt-2 mb-2 rounded-xl">
              <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Total Due</span>
              <span className="text-2xl font-black text-gray-900">R {Math.round(totalR).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 text-center leading-relaxed max-w-md mx-auto">
          Payment is required in full to dispatch order. Standard Terms & Conditions apply. 
          Quote is subject to stock availability block check.
        </p>

      </div>

      {/* Sticky Action Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-4 sm:px-10 sm:py-6 flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
        <button 
          onClick={onClose}
          className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm">
            <Download size={14} /> PDF
          </button>
          <button 
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest text-black transition-transform hover:scale-105 active:scale-95 shadow-lg"
            style={{ backgroundColor: activeColor }}
          >
            Confirm & Pay <CheckCircle2 size={16} />
          </button>
        </div>
      </div>
      </motion.div>
    </div>
  );
}
