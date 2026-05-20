/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ColumnMapping } from '../types';
import { Sparkles, HelpCircle, Shuffle } from 'lucide-react';
import { autoDetectMapping } from '../utils';

interface MappingControlsProps {
  headers: string[];
  mapping: ColumnMapping;
  onChange: (mapping: ColumnMapping) => void;
}

export function MappingControls({ headers, mapping, onChange }: MappingControlsProps) {
  
  // Quick helper to update a single key
  const handleSelectField = (key: keyof ColumnMapping, value: string) => {
    onChange({
      ...mapping,
      [key]: value
    });
  };

  // Trigger auto-detect
  const handleAutoDetect = () => {
    const detected = autoDetectMapping(headers);
    onChange(detected);
  };

  // Run auto-detect if the user just imported headers but hasn't mapped anything yet
  useEffect(() => {
    const isBlank = Object.values(mapping).every(v => v === '');
    if (isBlank && headers.length > 0) {
      handleAutoDetect();
    }
  }, [headers]);

  return (
    <div className="bg-white rounded-[24px] border border-border-natural shadow-[0_4px_22px_rgba(62,54,46,0.03)] p-6 space-y-5">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border-natural">
        <div>
          <h3 className="font-serif text-lg font-bold text-text-natural">1. Connect Columns</h3>
          <p className="text-xs text-text-natural/60 leading-normal font-sans">
            Map your sheet's column names to standard apparel attributes for consolidation.
          </p>
        </div>
        <button
          onClick={handleAutoDetect}
          type="button"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 self-start text-xs font-semibold text-accent-natural bg-muted-natural hover:bg-muted-natural/80 border border-border-natural rounded-xl transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Auto-Detect Columns
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Item Name (Required) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-natural/80 flex items-center justify-between font-sans">
            <span>Item Name / Description <span className="text-accent-natural">*</span></span>
          </label>
          <select
            value={mapping.itemName}
            onChange={(e) => handleSelectField('itemName', e.target.value)}
            className="w-full text-sm font-sans px-3 py-2 rounded-xl border border-border-natural bg-cream-natural hover:bg-muted-natural/50 focus:border-accent-natural focus:bg-white focus:outline-none transition"
          >
            <option value="">-- Choose Column --</option>
            {headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <p className="text-[10px] text-text-natural/50 font-mono">e.g., "Linen Summer Shirt"</p>
        </div>

        {/* Quantity (Required) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-natural/80 flex items-center justify-between font-sans">
            <span>Quantity Column <span className="text-accent-natural">*</span></span>
          </label>
          <select
            value={mapping.quantity}
            onChange={(e) => handleSelectField('quantity', e.target.value)}
            className="w-full text-sm font-sans px-3 py-2 rounded-xl border border-border-natural bg-cream-natural hover:bg-muted-natural/50 focus:border-accent-natural focus:bg-white focus:outline-none transition"
          >
            <option value="">-- Choose Column --</option>
            {headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <p className="text-[10px] text-text-natural/50 font-mono">e.g., "Order Qty" or "Count"</p>
        </div>

        {/* SKU / Style Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-natural/80 flex items-center gap-1 font-sans">
            <span>Style SKU / Ref #</span>
            <span className="text-[9px] bg-muted-natural text-accent-natural px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Recommended</span>
          </label>
          <select
            value={mapping.sku}
            onChange={(e) => handleSelectField('sku', e.target.value)}
            className="w-full text-sm font-sans px-3 py-2 rounded-xl border border-border-natural bg-cream-natural hover:bg-muted-natural/50 focus:border-accent-natural focus:bg-white focus:outline-none transition"
          >
            <option value="">-- Ignored (Will auto-group by Name) --</option>
            {headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <p className="text-[10px] text-text-natural/50 font-mono">e.g., "Style Reference", "SKU"</p>
        </div>

        {/* Size */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-natural/80 font-sans">Garment Size</label>
          <select
            value={mapping.size}
            onChange={(e) => handleSelectField('size', e.target.value)}
            className="w-full text-sm font-sans px-3 py-2 rounded-xl border border-border-natural bg-cream-natural hover:bg-muted-natural/50 focus:border-accent-natural focus:bg-white focus:outline-none transition"
          >
            <option value="">-- Ignored (Aggregate all sizes) --</option>
            {headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <p className="text-[10px] text-text-natural/50 font-mono">e.g., "S/M/L/XL" or "Chest Size"</p>
        </div>

        {/* Color */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-natural/80 font-sans">Colorway / Wash</label>
          <select
            value={mapping.color}
            onChange={(e) => handleSelectField('color', e.target.value)}
            className="w-full text-sm font-sans px-3 py-2 rounded-xl border border-border-natural bg-cream-natural hover:bg-muted-natural/50 focus:border-accent-natural focus:bg-white focus:outline-none transition"
          >
            <option value="">-- Ignored (Aggregate all colors) --</option>
            {headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <p className="text-[10px] text-text-natural/50 font-mono">e.g., "Colourway", "Wash"</p>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-natural/80 font-sans">Category / Department</label>
          <select
            value={mapping.category}
            onChange={(e) => handleSelectField('category', e.target.value)}
            className="w-full text-sm font-sans px-3 py-2 rounded-xl border border-border-natural bg-cream-natural hover:bg-muted-natural/50 focus:border-accent-natural focus:bg-white focus:outline-none transition"
          >
            <option value="">-- Uncategorized (Combined list) --</option>
            {headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <p className="text-[10px] text-text-natural/50 font-mono">e.g., "Department", "Supplier Code"</p>
        </div>
      </div>

      {(!mapping.itemName || !mapping.quantity) && (
        <div className="bg-muted-natural/55 rounded-xl p-3.5 border border-border-natural text-[11px] text-text-natural/80 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-accent-natural shrink-0" />
          <span>You must assign columns for <strong>Item Name</strong> and <strong>Quantity</strong> to generate consolidated charts.</span>
        </div>
      )}
    </div>
  );
}
