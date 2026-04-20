import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import type { Response } from 'express';
import type { InventoryProductDetail } from '../../inventory/contracts';
import { getUploadsDirectory } from '../uploads.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultLogoPath = path.resolve(__dirname, '../../Public/logo high res/Brick Tile Shop Logo 2022.png');
const brandGreen = '#00A86B';
const ink = '#111827';
const muted = '#667085';
const softBorder = '#E5E7EB';
const tableHeader = '#F3F6F4';

function formatZar(value: number) {
  return `R ${value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pricingUnitLabel(product: InventoryProductDetail) {
  if (product.pricing.unit === 'piece') {
    return product.category === 'Bricks' ? 'brick' : product.category === 'Paving' ? 'paver' : product.category === 'Blocks' ? 'block' : 'piece';
  }

  if (product.pricing.unit === 'm2') {
    return 'm²';
  }

  return 'pallet';
}

async function resolveImageBuffer(url?: string | null) {
  if (!url) {
    return null;
  }

  try {
    if (url.startsWith('/api/uploads/')) {
      const filename = url.replace('/api/uploads/', '');
      const absolutePath = path.join(getUploadsDirectory(), filename);
      return await fsPromises.readFile(absolutePath);
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }
      return Buffer.from(await response.arrayBuffer());
    }
  } catch {
    return null;
  }

  return null;
}

function envValue(key: string, fallback = '') {
  return process.env[key]?.trim() || fallback;
}

function getBranding() {
  const logoPath = envValue('BTS_PDF_LOGO_PATH', defaultLogoPath);

  return {
    logoPath: fs.existsSync(logoPath) ? logoPath : null,
    companyName: envValue('BTS_COMPANY_NAME', 'Brick Tile Shop'),
    tagline: envValue('BTS_COMPANY_TAGLINE', 'Premium clay bricks, cladding tiles and architectural surfaces'),
    email: envValue('BTS_COMPANY_EMAIL', 'sales@bricktileshop.co.za'),
    phone: envValue('BTS_COMPANY_PHONE', '+27 (0) 00 000 0000'),
    website: envValue('BTS_COMPANY_WEBSITE', 'www.bricktileshop.co.za'),
  };
}

function writeLabelValue(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width: number) {
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#98A2B3')
    .text(label.toUpperCase(), x, y, { width, characterSpacing: 1.2 });
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(ink)
    .text(value, x, y + 12, { width });
}

function writeSectionTitle(doc: PDFKit.PDFDocument, title: string, x: number, y: number) {
  doc.font('Helvetica-Bold').fontSize(10).fillColor(ink).text(title.toUpperCase(), x, y, {
    characterSpacing: 1.5,
  });
  doc.moveTo(x, y + 17).lineTo(x + 515, y + 17).lineWidth(0.6).strokeColor(softBorder).stroke();
}

export async function streamProductSpecSheet(
  response: Response,
  product: InventoryProductDetail,
  options: { disposition?: 'inline' | 'attachment' } = {},
) {
  const safeSku = product.publicSku.replace(/[^A-Za-z0-9_-]+/g, '-');
  const filename = `${safeSku.toLowerCase()}-spec-sheet.pdf`;
  const disposition = options.disposition ?? 'inline';
  const imageBuffer = await resolveImageBuffer(
    product.requiredMedia.heroImageUrl ??
      product.requiredMedia.primaryImageUrl ??
      product.requiredMedia.galleryImageUrl ??
      product.requiredMedia.faceImageUrl,
  );

  response.setHeader('Content-Type', 'application/pdf');
  response.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
  const branding = getBranding();

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `${product.name} Spec Sheet`,
      Author: 'BTS ERP OS',
      Subject: `${product.publicSku} technical specification sheet`,
    },
  });

  doc.pipe(response);

  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FFFFFF');

  if (branding.logoPath) {
    try {
      doc.image(branding.logoPath, 40, 30, { width: 150 });
    } catch {
      doc.font('Helvetica-Bold').fontSize(18).fillColor(ink).text(branding.companyName, 40, 38, { width: 190 });
    }
  } else {
    doc.font('Helvetica-Bold').fontSize(18).fillColor(ink).text(branding.companyName, 40, 38, { width: 190 });
  }

  doc.font('Helvetica-Bold').fontSize(22).fillColor(ink).text('PRODUCT SPEC SHEET', 320, 38, {
    width: 235,
    align: 'right',
  });
  doc.font('Helvetica').fontSize(10).fillColor(muted).text(product.name, 320, 66, {
    width: 235,
    align: 'right',
  });
  doc.font('Helvetica-Bold').fontSize(10).fillColor(brandGreen).text(product.publicSku, 320, 84, {
    width: 235,
    align: 'right',
  });

  doc.moveTo(40, 112).lineTo(555, 112).lineWidth(1).strokeColor(softBorder).stroke();

  doc.font('Helvetica-Bold').fontSize(20).fillColor(ink).text(product.name, 40, 136, { width: 300 });
  doc.font('Helvetica').fontSize(10).fillColor(muted).text(branding.tagline, 40, 162, { width: 300 });
  doc.font('Helvetica-Bold').fontSize(13).fillColor(brandGreen).text(`${formatZar(product.pricing.sellPriceZar)} / ${pricingUnitLabel(product)}`, 40, 184);

  if (imageBuffer) {
    doc.roundedRect(370, 132, 185, 142, 18).fill('#F8FAFC').strokeColor(softBorder).stroke();
    doc.image(imageBuffer, 380, 142, {
      fit: [165, 122],
      align: 'center',
      valign: 'center',
    });
  }

  doc.fillColor('#344054').font('Helvetica').fontSize(10).text(product.description, 40, 212, {
    width: 300,
    height: 52,
    lineGap: 3,
  });

  doc.roundedRect(40, 296, 515, 74, 12).fill('#FAFAFA').strokeColor(softBorder).stroke();
  writeLabelValue(doc, 'Category', product.category, 58, 313, 120);
  writeLabelValue(doc, 'Type', product.productType, 188, 313, 120);
  writeLabelValue(doc, 'Finish', product.finish ?? 'N/A', 318, 313, 100);
  writeLabelValue(doc, 'Supplier', product.logistics.defaultSupplierName ?? 'Unlinked', 430, 313, 105);

  writeSectionTitle(doc, 'Core Product Metrics', 40, 408);
  doc.rect(40, 438, 515, 28).fill(tableHeader);
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#475467').text('DIMENSIONS', 58, 448, { width: 170, characterSpacing: 1 });
  doc.text('PACKAGING', 238, 448, { width: 150, characterSpacing: 1 });
  doc.text('COVERAGE', 408, 448, { width: 105, characterSpacing: 1 });
  writeLabelValue(doc, 'Length', `${product.dimensions.lengthMm} mm`, 58, 482, 100);
  writeLabelValue(doc, 'Width', `${product.dimensions.widthMm} mm`, 168, 482, 100);
  writeLabelValue(doc, 'Height', `${product.dimensions.heightMm} mm`, 278, 482, 100);
  writeLabelValue(doc, 'Weight', `${product.dimensions.weightKg.toFixed(2)} kg`, 388, 482, 110);
  writeLabelValue(doc, 'Units / m²', product.dimensions.unitsPerM2.toFixed(2), 58, 532, 100);
  writeLabelValue(doc, 'Pieces / Pallet', `${product.packaging.piecesPerPallet}`, 168, 532, 100);
  writeLabelValue(doc, 'Pallets / Truck', `${product.packaging.palletsPerTruck}`, 278, 532, 100);
  writeLabelValue(doc, 'Coverage Face', product.dimensions.coverageOrientation, 388, 532, 110);

  writeSectionTitle(doc, 'Latest Approved Test Results', 40, 606);

  const testRows = product.testResults.length > 0
    ? product.testResults
    : [{ type: 'Water Absorption (%)', value: 0, unit: 'Pending', notes: 'No test result stored yet.' }];

  let rowY = 636;
  for (const result of testRows.slice(0, 4)) {
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#667085')
      .text(result.type.toUpperCase(), 58, rowY, { width: 220, characterSpacing: 1.1 });
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(ink)
      .text(`${result.value} ${result.unit}`.trim(), 58, rowY + 12, { width: 160 });
    if (result.notes) {
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(muted)
        .text(result.notes, 210, rowY + 12, { width: 315 });
    }
    rowY += 36;
  }

  doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FFFFFF');
  if (branding.logoPath) {
    try {
      doc.image(branding.logoPath, 40, 36, { width: 140 });
    } catch {
      doc.font('Helvetica-Bold').fontSize(18).fillColor(ink).text(branding.companyName, 40, 44, { width: 190 });
    }
  } else {
    doc.font('Helvetica-Bold').fontSize(18).fillColor(ink).text(branding.companyName, 40, 44, { width: 190 });
  }
  doc.font('Helvetica-Bold').fontSize(22).fillColor(ink).text('REPORT REFERENCE', 40, 144);
  doc.font('Helvetica').fontSize(10).fillColor(muted).text(
    `Technical and commercial reference for ${product.publicSku}.`,
    40,
    174,
    { width: 515 },
  );
  doc.roundedRect(40, 226, 515, 148, 14).fill('#FAFAFA').strokeColor(softBorder).stroke();
  writeLabelValue(doc, 'Laboratory', product.latestTestReport.laboratoryName ?? 'Pending', 58, 250, 180);
  writeLabelValue(doc, 'Standard', product.latestTestReport.methodStandard ?? 'Pending', 250, 250, 160);
  writeLabelValue(doc, 'Report Ref', product.latestTestReport.reportReference ?? 'Pending', 420, 250, 105);
  writeLabelValue(doc, 'Tested', product.latestTestReport.testedAt ? new Date(product.latestTestReport.testedAt).toLocaleDateString('en-ZA') : 'Pending', 58, 306, 120);
  writeLabelValue(doc, 'Issued', product.latestTestReport.issuedAt ? new Date(product.latestTestReport.issuedAt).toLocaleDateString('en-ZA') : 'Pending', 188, 306, 120);
  writeLabelValue(doc, 'Spec Sheet Generated', new Date().toLocaleDateString('en-ZA'), 318, 306, 160);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(muted)
    .text(`${branding.companyName} / ${branding.email} / ${branding.phone} / ${branding.website}`, 40, 716, {
      width: 515,
      align: 'center',
    });

  doc.end();
}
