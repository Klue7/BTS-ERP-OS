import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Copy, Download, ExternalLink, FileText, Inbox, Mail, MessageCircle, Share2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useVisualLab } from './VisualLabContext';

export interface PdfPreviewDocument {
  url: string;
  title: string;
  subtitle?: string | null;
  fileName?: string | null;
}

interface PdfPreviewContextValue {
  openPdfPreview: (document: PdfPreviewDocument) => void;
  closePdfPreview: () => void;
}

const PdfPreviewContext = createContext<PdfPreviewContextValue | undefined>(undefined);

function withQueryParam(url: string, key: string, value: string) {
  if (!url) return url;

  try {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.set(key, value);
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }
}

function toAbsoluteUrl(url: string) {
  if (!url || typeof window === 'undefined') return url;

  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
}

function buildShareText(document: PdfPreviewDocument, shareUrl: string) {
  const subtitle = document.subtitle ? ` (${document.subtitle})` : '';
  return `Please find the BTS document ${document.title}${subtitle}: ${shareUrl}`;
}

function buildMailtoUrl(document: PdfPreviewDocument, shareText: string) {
  const subject = `BTS document: ${document.title}`;
  const body = `Hi,\n\n${shareText}\n\nRegards,\nBrick Tile Shop`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildWhatsAppUrl(shareText: string) {
  return `https://wa.me/?text=${encodeURIComponent(shareText)}`;
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export function PdfPreviewProvider({ children }: { children: React.ReactNode }) {
  const [activeDocument, setActiveDocument] = useState<PdfPreviewDocument | null>(null);
  const navigate = useNavigate();
  const { userRole } = useVisualLab();

  const closePdfPreview = useCallback(() => {
    setActiveDocument(null);
  }, []);

  const openPdfPreview = useCallback((document: PdfPreviewDocument) => {
    if (!document.url) return;
    setActiveDocument(document);
  }, []);

  useEffect(() => {
    if (!activeDocument) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePdfPreview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDocument, closePdfPreview]);

  const value = useMemo(() => ({ openPdfPreview, closePdfPreview }), [openPdfPreview, closePdfPreview]);
  const previewUrl = activeDocument?.url ? withQueryParam(activeDocument.url, 'inline', '1') : '';
  const downloadUrl = activeDocument?.url ? withQueryParam(activeDocument.url, 'download', '1') : '';
  const absolutePreviewUrl = previewUrl ? toAbsoluteUrl(previewUrl) : '';
  const shareText = activeDocument ? buildShareText(activeDocument, absolutePreviewUrl) : '';
  const mailtoUrl = activeDocument ? buildMailtoUrl(activeDocument, shareText) : '';
  const whatsAppUrl = activeDocument ? buildWhatsAppUrl(shareText) : '';
  const canOpenComms = userRole === 'employee';

  const handleCopyShareText = useCallback(async () => {
    if (!shareText) return;
    try {
      await copyTextToClipboard(shareText);
      toast.success('Document share text copied.');
    } catch {
      toast.error('Could not copy the document share text.');
    }
  }, [shareText]);

  const handleNativeShare = useCallback(async () => {
    if (!activeDocument || !absolutePreviewUrl) return;

    const shareNavigator = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };

    if (!shareNavigator.share) {
      await handleCopyShareText();
      toast.message('Native sharing is not available in this browser, so the share text was copied.');
      return;
    }

    try {
      await shareNavigator.share({
        title: activeDocument.title,
        text: shareText,
        url: absolutePreviewUrl,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      toast.error('Could not open the system share sheet.');
    }
  }, [absolutePreviewUrl, activeDocument, handleCopyShareText, shareText]);

  const handleOpenComms = useCallback(async () => {
    if (!shareText) return;
    try {
      await copyTextToClipboard(shareText);
    } catch {
      // The query parameter still stages the message even when clipboard access is blocked.
    }
    closePdfPreview();
    navigate(`/portal?module=Comms&shareDraft=${encodeURIComponent(shareText)}`);
    toast.success('Document share message staged in Comms.');
  }, [closePdfPreview, navigate, shareText]);

  return (
    <PdfPreviewContext.Provider value={value}>
      {children}

      {activeDocument ? (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 p-3 text-white backdrop-blur-md sm:p-6">
          <button
            type="button"
            aria-label="Close PDF preview"
            onClick={closePdfPreview}
            className="absolute inset-0 cursor-default"
          />

          <section className="relative flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#060606] shadow-[0_40px_140px_rgba(0,0,0,0.75)]">
            <header className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.03] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#00ff88]/20 bg-[#00ff88]/10 text-[#00ff88]">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-mono uppercase tracking-[0.32em] text-white/30">Generated Document Preview</p>
                  <h2 className="mt-1 truncate font-serif text-xl font-bold uppercase tracking-tight text-white sm:text-2xl">
                    {activeDocument.title}
                  </h2>
                  {activeDocument.subtitle ? (
                    <p className="mt-1 truncate text-[10px] font-mono uppercase tracking-widest text-white/35">{activeDocument.subtitle}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={downloadUrl}
                  download={activeDocument.fileName ?? undefined}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/60 transition-all hover:border-white/20 hover:text-white"
                >
                  <Download size={14} />
                  Download
                </a>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/60 transition-all hover:border-white/20 hover:text-white"
                >
                  <ExternalLink size={14} />
                  New Tab
                </a>
                <button
                  type="button"
                  onClick={closePdfPreview}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            <div className="flex flex-col gap-3 border-b border-white/10 bg-black/30 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/25">Share Document</p>
                <p className="mt-1 text-xs text-white/45">Send the live PDF link through WhatsApp, email, the system share sheet, or the internal Comms inbox.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#22c55e]/15 bg-[#22c55e]/10 px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-[#22c55e] transition-all hover:border-[#22c55e]/30 hover:bg-[#22c55e]/15"
                >
                  <MessageCircle size={13} />
                  WhatsApp
                </a>
                <a
                  href={mailtoUrl}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white/60 transition-all hover:border-white/20 hover:text-white"
                >
                  <Mail size={13} />
                  Email
                </a>
                <button
                  type="button"
                  onClick={() => { void handleNativeShare(); }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white/60 transition-all hover:border-white/20 hover:text-white"
                >
                  <Share2 size={13} />
                  Share
                </button>
                <button
                  type="button"
                  onClick={() => { void handleCopyShareText(); }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white/60 transition-all hover:border-white/20 hover:text-white"
                >
                  <Copy size={13} />
                  Copy
                </button>
                {canOpenComms ? (
                  <button
                    type="button"
                    onClick={() => { void handleOpenComms(); }}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/10 px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-[#00ff88] transition-all hover:border-[#00ff88]/35 hover:bg-[#00ff88]/15"
                  >
                    <Inbox size={13} />
                    Open Comms
                  </button>
                ) : null}
              </div>
            </div>

            <div className="relative flex-1 bg-[#111]">
              <iframe
                key={previewUrl}
                src={previewUrl}
                title={activeDocument.title}
                className="h-full w-full border-0 bg-white"
              />
              <div className="pointer-events-none absolute bottom-4 left-1/2 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full border border-black/10 bg-black/70 px-4 py-2 text-center text-[10px] font-mono uppercase tracking-widest text-white/45 backdrop-blur-md">
                If your browser blocks inline PDF rendering, use New Tab or Download.
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </PdfPreviewContext.Provider>
  );
}

export function usePdfPreview() {
  const context = useContext(PdfPreviewContext);
  if (!context) {
    throw new Error('usePdfPreview must be used inside PdfPreviewProvider.');
  }
  return context;
}
