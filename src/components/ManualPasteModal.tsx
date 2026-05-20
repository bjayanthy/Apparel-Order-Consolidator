/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Clipboard, AlertTriangle, HelpCircle } from 'lucide-react';

interface ManualPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataParsed: (headers: string[], rows: Record<string, string | number>[]) => void;
}

export function ManualPasteModal({ isOpen, onClose, onDataParsed }: ManualPasteModalProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePasteDemo = () => {
    const demoData = 
`Style SKU\tGarment Name\tColorway\tSize\tOrder Qty\tCategory
LN-BTN-01\tLinen Summer Button-Up\tSage Green\tM\t15\tTops
LN-BTN-01\tLinen Summer Button-Up\tSage Green\tM\t12\tTops
LN-BTN-01\tLinen Summer Button-Up\tSage Green\tL\t20\tTops
OG-TEE-22\tHeavyweight Slub Tee\tVintage White\tS\t25\tBasics
OG-TEE-22\tHeavyweight Slub Tee\tVintage White\tS\t30\tBasics
DN-JKT-08\tSelvedge Denim Jacket\tIndigo Wash\tM\t10\tOuterwear`;
    setText(demoData);
    setError(null);
  };

  const handleProcess = () => {
    if (!text.trim()) {
      setError('Please paste some text from your worksheet first.');
      return;
    }

    try {
      // Split text by lines
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        setError('Data must include at least a header row and one data row.');
        return;
      }

      // Check TSV vs CSV
      const rowsRaw: string[][] = [];
      for (const line of lines) {
        let cells: string[] = [];
        if (line.includes('\t')) {
          cells = line.split('\t');
        } else {
          cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => {
            let clean = cell.trim();
            if (clean.startsWith('"') && clean.endsWith('"')) {
              clean = clean.substring(1, clean.length - 1).replace(/""/g, '"');
            }
            return clean;
          });
        }
        rowsRaw.push(cells);
      }

      const headers = rowsRaw[0].map(h => h.trim()).filter(h => h !== '');
      if (headers.length === 0) {
        setError('Could not detect any valid header columns.');
        return;
      }

      const rows: Record<string, string | number>[] = [];
      for (let i = 1; i < rowsRaw.length; i++) {
        const cells = rowsRaw[i];
        const rowObj: Record<string, string | number> = {};
        
        headers.forEach((h, colIndex) => {
          const val = cells[colIndex] !== undefined ? cells[colIndex].trim() : '';
          if (val !== '' && !isNaN(Number(val))) {
            rowObj[h] = Number(val);
          } else {
            rowObj[h] = val;
          }
        });

        if (Object.values(rowObj).some(val => val !== '')) {
          rows.push(rowObj);
        }
      }

      if (rows.length === 0) {
        setError('No rows with valid data were parsed.');
        return;
      }

      onDataParsed(headers, rows);
      setText('');
      setError(null);
      onClose();
    } catch (err: any) {
      setError('Slight parsing error: ' + (err.message || 'Check your format.'));
    }
  };

  return (
    <div className="fixed inset-0 bg-text-natural/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] max-w-2xl w-full border border-border-natural shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-border-natural flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-muted-natural text-accent-natural">
              <Clipboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-text-natural">Paste Spreadsheet Rows</h3>
              <p className="text-xs text-text-natural/60">Copy table cells from Excel or Sheets (Ctrl+C) and press Ctrl+V below</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-text-natural/40 hover:text-text-natural font-medium text-lg p-2 hover:bg-muted-natural rounded-lg transition"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="bg-muted-natural/60 rounded-xl p-4 border border-border-natural flex gap-3 text-text-natural text-xs">
            <HelpCircle className="w-4 h-4 text-accent-natural shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">How to copy paste:</span>
              <p className="text-text-natural/80 leading-normal font-sans">
                Highlight your column headers along with your rows in Excel (e.g. <strong>SKU</strong>, <strong>Name</strong>, <strong>Qty</strong>) and copy them.
                Paste them directly in the field below. The app auto-detects tabs and commas automatically!
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center font-sans">
            <label className="text-xs font-bold text-text-natural/80 uppercase tracking-wide">Pasted Sheet Content</label>
            <button
              onClick={handlePasteDemo}
              className="text-xs text-accent-natural hover:text-text-natural uppercase font-bold tracking-wider"
            >
              Insert Sample Text
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            placeholder="Style SKU	Garment Name	Color	Size	Order Qty&#10;TSH-01	Linen Crew Tee	Navy	M	35&#10;TSH-01	Linen Crew Tee	Navy	M	45&#10;TSH-01	Linen Crew Tee	White	L	12"
            rows={10}
            className="w-full p-4 rounded-xl border border-border-natural focus:border-accent-natural focus:outline-none font-mono text-xs leading-relaxed bg-cream-natural resize-y"
          />

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-3.5 rounded-xl flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-cream-natural border-t border-border-natural flex justify-end gap-3 font-sans">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border-natural text-text-natural rounded-xl text-sm font-medium hover:bg-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleProcess}
            className="px-5 py-2 bg-accent-natural hover:opacity-90 text-white rounded-full text-sm font-medium transition shadow-sm cursor-pointer"
          >
            Import Rows
          </button>
        </div>
      </div>
    </div>
  );
}
