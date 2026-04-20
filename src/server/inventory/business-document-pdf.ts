import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import type { Response } from 'express';
import type { BusinessDocumentSummary } from '../../inventory/contracts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultLogoPath = path.resolve(__dirname, '../../Public/logo high res/Brick Tile Shop Logo 2022.png');
const brandGreen = '#00A86B';
const ink = '#111827';
const muted = '#667085';
const softBorder = '#E5E7EB';
const tableHeader = '#F3F6F4';

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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
    address: envValue('BTS_COMPANY_ADDRESS', 'South Africa'),
  };
}

function getBankingDetails() {
  return {
    accountName: envValue('BTS_BANK_ACCOUNT_NAME', 'Brick Tile Shop'),
    bankName: envValue('BTS_BANK_NAME', 'Bank details pending confirmation'),
    accountNumber: envValue('BTS_BANK_ACCOUNT_NUMBER', 'Set BTS_BANK_ACCOUNT_NUMBER in .env'),
    branchCode: envValue('BTS_BANK_BRANCH_CODE', 'Set BTS_BANK_BRANCH_CODE in .env'),
    accountType: envValue('BTS_BANK_ACCOUNT_TYPE', 'Business Account'),
    referenceNote: envValue('BTS_BANK_REFERENCE_NOTE', 'Use the quote or invoice number as payment reference.'),
  };
}

function showBankingDetails(documentType: BusinessDocumentSummary['type']) {
  return ['Customer Quote', 'Customer Order', 'Customer Invoice', 'Credit Note'].includes(documentType);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readText(record: Record<string, unknown>, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return fallback;
}

function readNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function writeMeta(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width: number) {
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#98A2B3')
    .text(label.toUpperCase(), x, y, { width, characterSpacing: 1.2 });
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(ink)
    .text(value, x, y + 12, { width });
}

function writeSectionTitle(doc: PDFKit.PDFDocument, title: string, x: number, y: number) {
  doc.font('Helvetica-Bold').fontSize(10).fillColor(ink).text(title.toUpperCase(), x, y, {
    characterSpacing: 1.5,
  });
  doc.moveTo(x, y + 17).lineTo(x + 515, y + 17).lineWidth(0.6).strokeColor(softBorder).stroke();
}

function writeAddressBlock(doc: PDFKit.PDFDocument, label: string, lines: string[], x: number, y: number, width: number) {
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#98A2B3').text(label.toUpperCase(), x, y, {
    width,
    characterSpacing: 1.2,
  });
  let cursorY = y + 16;
  for (const line of lines.filter(Boolean).slice(0, 5)) {
    doc.font(line === lines[0] ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).fillColor(ink).text(line, x, cursorY, {
      width,
      lineGap: 1.5,
    });
    cursorY += line === lines[0] ? 14 : 13;
  }
}

function writeEftBlock(doc: PDFKit.PDFDocument, documentSummary: BusinessDocumentSummary, y: number) {
  const banking = getBankingDetails();
  doc.roundedRect(40, y, 515, 98, 14).fill('#F7FAF8').strokeColor('#DCEFE5').stroke();
  doc.font('Helvetica-Bold').fontSize(11).fillColor(ink).text('EFT PAYMENT DETAILS', 58, y + 16);
  doc.font('Helvetica').fontSize(8).fillColor(muted).text('Use these details for bank transfer payments.', 58, y + 32);

  const leftX = 58;
  const rightX = 318;
  writeMeta(doc, 'Account Name', banking.accountName, leftX, y + 52, 210);
  writeMeta(doc, 'Bank', banking.bankName, leftX, y + 78, 210);
  writeMeta(doc, 'Account Number', banking.accountNumber, rightX, y + 52, 205);
  writeMeta(doc, 'Branch / Type', `${banking.branchCode} / ${banking.accountType}`, rightX, y + 78, 205);

  doc.font('Helvetica-Bold').fontSize(8).fillColor(brandGreen).text(`Reference: ${documentSummary.key}`, 58, y + 112, {
    width: 230,
  });
  doc.font('Helvetica').fontSize(8).fillColor(muted).text(banking.referenceNote, 318, y + 112, {
    width: 220,
  });
}

export async function streamBusinessDocumentPdf(
  response: Response,
  documentSummary: BusinessDocumentSummary,
  snapshot: Record<string, unknown>,
  options: { disposition?: 'inline' | 'attachment' } = {},
) {
  const safeKey = documentSummary.key.replace(/[^A-Za-z0-9_-]+/g, '-').toLowerCase();
  const disposition = options.disposition ?? 'inline';
  response.setHeader('Content-Type', 'application/pdf');
  response.setHeader('Content-Disposition', `${disposition}; filename="${safeKey}.pdf"`);
  const branding = getBranding();

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: documentSummary.title,
      Author: 'BTS ERP OS',
      Subject: `${documentSummary.type} history record`,
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

  doc.font('Helvetica-Bold').fontSize(22).fillColor(ink).text(documentSummary.type.toUpperCase(), 350, 38, {
    width: 205,
    align: 'right',
  });
  doc.font('Helvetica').fontSize(10).fillColor(muted).text(documentSummary.title, 350, 66, {
    width: 205,
    align: 'right',
  });
  doc.font('Helvetica-Bold').fontSize(10).fillColor(brandGreen).text(documentSummary.key, 350, 84, {
    width: 205,
    align: 'right',
  });

  doc.moveTo(40, 112).lineTo(555, 112).lineWidth(1).strokeColor(softBorder).stroke();

  writeAddressBlock(
    doc,
    'From',
    [branding.companyName, branding.tagline, branding.email, branding.phone, branding.website, branding.address],
    40,
    132,
    230,
  );

  const recipientName = documentSummary.customerName ?? documentSummary.supplierName ?? 'Recipient to be confirmed';
  const recipientLines = [
    recipientName,
    documentSummary.customerName ? 'Customer account' : documentSummary.supplierName ? 'Supplier account' : '',
    documentSummary.productName ? `Product: ${documentSummary.productName}` : '',
    documentSummary.productSku ? `SKU: ${documentSummary.productSku}` : '',
  ];
  writeAddressBlock(doc, 'To', recipientLines, 315, 132, 240);

  doc.roundedRect(40, 236, 515, 74, 12).fill('#FAFAFA').strokeColor(softBorder).stroke();
  writeMeta(doc, 'Status', documentSummary.status, 58, 253, 105);
  writeMeta(doc, 'Issued', new Date(documentSummary.issuedAt).toLocaleDateString('en-ZA'), 176, 253, 105);
  writeMeta(doc, 'Due', documentSummary.dueAt ? new Date(documentSummary.dueAt).toLocaleDateString('en-ZA') : 'N/A', 294, 253, 105);
  writeMeta(doc, 'Amount', formatMoney(documentSummary.totalAmount, documentSummary.currency), 412, 253, 125);

  writeSectionTitle(doc, 'Document Summary', 40, 338);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#344054')
    .text(
      typeof snapshot.summary === 'string' ? snapshot.summary : documentSummary.summary ?? 'Deterministic document history record.',
      40,
      365,
      { width: 515, height: 44, lineGap: 3 },
    );

  const lineItems = Array.isArray(snapshot.lineItems) ? snapshot.lineItems : [];
  writeSectionTitle(doc, 'Line Items', 40, 428);
  const tableTop = 458;
  doc.rect(40, tableTop, 515, 28).fill(tableHeader);
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#475467');
  doc.text('ITEM', 52, tableTop + 10, { width: 240, characterSpacing: 1 });
  doc.text('QTY', 310, tableTop + 10, { width: 52, align: 'right', characterSpacing: 1 });
  doc.text('UNIT', 376, tableTop + 10, { width: 70, align: 'right', characterSpacing: 1 });
  doc.text('TOTAL', 462, tableTop + 10, { width: 78, align: 'right', characterSpacing: 1 });

  let rowY = tableTop + 40;
  if (lineItems.length === 0) {
    doc.font('Helvetica').fontSize(10).fillColor(muted).text('No line items were captured for this record.', 52, rowY);
    rowY += 30;
  } else {
    for (const rawItem of lineItems.slice(0, 4)) {
      const line = asRecord(rawItem);
      if (!line) continue;

      const lineTitle = readText(line, ['name', 'description', 'sku'], 'Line Item');
      const sku = readText(line, ['sku', 'publicSku']);
      const quantity = readNumber(line, ['quantity', 'qty']);
      const unit = readText(line, ['unit', 'pricingUnit'], 'units');
      const unitAmount =
        documentSummary.type === 'Purchase Order' || documentSummary.type === 'Supplier Invoice'
          ? readNumber(line, ['unitCostZar', 'unitPriceZar'])
          : readNumber(line, ['unitPriceZar', 'unitCostZar']);
      const totalAmount =
        documentSummary.type === 'Purchase Order' || documentSummary.type === 'Supplier Invoice'
          ? readNumber(line, ['totalCostZar', 'totalPriceZar'])
          : readNumber(line, ['totalPriceZar', 'totalCostZar']);

      doc.moveTo(40, rowY - 9).lineTo(555, rowY - 9).lineWidth(0.5).strokeColor('#EEF2F6').stroke();
      doc.font('Helvetica-Bold').fontSize(10).fillColor(ink).text(lineTitle, 52, rowY, { width: 240 });
      if (sku) {
        doc.font('Helvetica').fontSize(8).fillColor('#98A2B3').text(sku, 52, rowY + 14, { width: 210 });
      }
      doc.font('Helvetica').fontSize(9).fillColor('#344054').text(quantity === null ? '-' : quantity.toLocaleString('en-ZA'), 310, rowY + 4, {
        width: 52,
        align: 'right',
      });
      doc.font('Helvetica').fontSize(9).fillColor('#344054').text(unit, 376, rowY + 4, { width: 70, align: 'right' });
      doc.font('Helvetica-Bold').fontSize(9).fillColor(ink).text(totalAmount === null ? '-' : formatMoney(totalAmount, documentSummary.currency), 462, rowY + 4, {
        width: 78,
        align: 'right',
      });
      if (unitAmount !== null) {
        doc.font('Helvetica').fontSize(7).fillColor('#98A2B3').text(`${formatMoney(unitAmount, documentSummary.currency)} ea`, 462, rowY + 17, {
          width: 78,
          align: 'right',
        });
      }
      rowY += 38;
    }

    if (lineItems.length > 4) {
      doc.font('Helvetica').fontSize(8).fillColor(muted).text(`+ ${lineItems.length - 4} additional line item${lineItems.length - 4 === 1 ? '' : 's'} retained in the workflow record.`, 52, rowY);
      rowY += 22;
    }
  }

  const totalsY = Math.max(rowY + 16, 622);
  const subtotal = documentSummary.totalAmount / 1.15;
  const vat = documentSummary.totalAmount - subtotal;
  doc.roundedRect(333, totalsY, 222, 88, 12).fill('#FAFAFA').strokeColor(softBorder).stroke();
  doc.font('Helvetica').fontSize(9).fillColor(muted).text('Subtotal excl. VAT', 350, totalsY + 16, { width: 100 });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(ink).text(formatMoney(subtotal, documentSummary.currency), 444, totalsY + 16, { width: 94, align: 'right' });
  doc.font('Helvetica').fontSize(9).fillColor(muted).text('VAT estimate 15%', 350, totalsY + 36, { width: 100 });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(ink).text(formatMoney(vat, documentSummary.currency), 444, totalsY + 36, { width: 94, align: 'right' });
  doc.font('Helvetica-Bold').fontSize(11).fillColor(ink).text('TOTAL DUE', 350, totalsY + 62, { width: 100 });
  doc.font('Helvetica-Bold').fontSize(14).fillColor(brandGreen).text(formatMoney(documentSummary.totalAmount, documentSummary.currency), 444, totalsY + 58, {
    width: 94,
    align: 'right',
  });

  const notes = Array.isArray(snapshot.notes) ? snapshot.notes.filter((note): note is string => typeof note === 'string') : [];
  const noteY = totalsY + 4;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(ink).text('Notes', 40, noteY);
  const noteCopy = notes.length > 0
    ? notes.slice(0, 4)
    : ['Payment is required before supplier procurement or dispatch unless credit terms are approved.', 'Generated from BTS ERP OS workflow records.'];
  let currentNoteY = noteY + 18;
  for (const note of noteCopy) {
    doc.font('Helvetica').fontSize(8).fillColor(muted).text(`• ${note}`, 40, currentNoteY, { width: 260, lineGap: 2 });
    currentNoteY += 16;
  }

  if (showBankingDetails(documentSummary.type)) {
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
    doc.font('Helvetica-Bold').fontSize(22).fillColor(ink).text('PAYMENT INSTRUCTIONS', 40, 144);
    doc.font('Helvetica').fontSize(10).fillColor(muted).text(
      `Bank transfer details for ${documentSummary.key}. Send proof of payment to ${branding.email}.`,
      40,
      174,
      { width: 515 },
    );
    writeEftBlock(doc, documentSummary, 232);
  } else {
    doc.font('Helvetica').fontSize(8).fillColor('#98A2B3').text(
      'This document is generated from the BTS operational workflow. Use the document key for all internal and external correspondence.',
      40,
      744,
      { width: 515, align: 'center' },
    );
  }

  doc.end();
}
