/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SafetyStockSettings } from '../types';
import { ShieldCheck, Plus, Percent, Sparkles } from 'lucide-react';

interface SafetyStockPanelProps {
  settings: SafetyStockSettings;
  onChange: (settings: SafetyStockSettings) => void;
  totalOriginalQty: number;
  totalConsolidatedQty: number;
}

export function SafetyStockPanel({ settings, onChange, totalOriginalQty, totalConsolidatedQty }: SafetyStockPanelProps) {
  
  const handleTypeChange = (type: 'percentage' | 'fixed') => {
    onChange({
      ...settings,
      globalType: type,
      // Reset to a logical default if switching to avoid absurd numbers
      globalValue: type === 'percentage' ? 5 : 2
    });
  };

  const handleValueChange = (valStr: string) => {
    const parsed = parseInt(valStr.replace(/[^0-9]/g, ''), 10);
    const value = isNaN(parsed) ? 0 : Math.max(0, parsed);
    onChange({
      ...settings,
      globalValue: value
    });
  };

  const handleNoBuffer = () => {
    onChange({
      ...settings,
      globalValue: 0
    });
  };

  const bufferCount = totalConsolidatedQty - totalOriginalQty;

  return (
    <div className="bg-white rounded-[24px] border border-border-natural shadow-[0_4px_22px_rgba(62,54,46,0.03)] p-6 space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-border-natural">
        <div className="p-2.5 rounded-xl bg-accent-natural text-white">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-bold text-text-natural">2. Vendor Safety Buffer (Optional)</h3>
          <p className="text-xs text-text-natural/60 font-sans">Add safety stocks or spoilage allowances automatically per Consolidated line.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          onClick={handleNoBuffer}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
            settings.globalValue === 0
              ? 'bg-accent-natural border-accent-natural text-white'
              : 'bg-white border-border-natural text-text-natural hover:bg-muted-natural'
          }`}
        >
          Exact Counts (No Buffer)
        </button>

        <button
          onClick={() => handleTypeChange('percentage')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
            settings.globalValue > 0 && settings.globalType === 'percentage'
              ? 'bg-accent-natural border-accent-natural text-white'
              : 'bg-white border-border-natural text-text-natural hover:bg-muted-natural'
          }`}
        >
          <Percent className="w-3 h-3" />
          Add Percentage Extra
        </button>

        <button
          onClick={() => handleTypeChange('fixed')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
            settings.globalValue > 0 && settings.globalType === 'fixed'
              ? 'bg-accent-natural border-accent-natural text-white'
              : 'bg-white border-border-natural text-text-natural hover:bg-muted-natural'
          }`}
        >
          <Plus className="w-3 h-3" />
          Add Flat Quantity Per Line
        </button>
      </div>

      {settings.globalValue > 0 && (
        <div className="space-y-4 pt-1 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-text-natural/80 font-sans">Set Buffer Value:</span>
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                value={settings.globalValue}
                onChange={(e) => handleValueChange(e.target.value)}
                className="w-20 px-3 py-1.5 text-sm font-sans rounded-l-xl border border-r-0 border-border-natural focus:outline-none focus:border-accent-natural focus:bg-white bg-cream-natural transition"
              />
              <span className="px-3 py-2 text-xs font-bold border border-border-natural bg-muted-natural rounded-r-xl select-none text-accent-natural">
                {settings.globalType === 'percentage' ? '%' : 'pcs'}
              </span>
            </div>
            <p className="text-[11px] text-text-natural/50">
              {settings.globalType === 'percentage' 
                ? 'Adds a percentage overhead to each line (rounded up to nearest integer)' 
                : 'Adds a constant quantity to every size, color, SKU entry combo'}
            </p>
          </div>

          {bufferCount > 0 && (
            <div className="p-3.5 bg-muted-natural/60 border border-border-natural rounded-xl flex items-center justify-between text-xs text-text-natural/90 font-sans">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-natural" />
                <span>
                  Allowing <strong>{bufferCount} additional safety pieces</strong> across this purchase dispatch.
                </span>
              </div>
              <span className="font-mono text-xs font-bold bg-[#EBE3D5] px-2 py-0.5 rounded text-text-natural">
                +{Math.round((bufferCount / totalOriginalQty) * 100)}% cumulative buffer
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
