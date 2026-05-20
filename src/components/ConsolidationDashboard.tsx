/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ApparelOrderRow, 
  ColumnMapping, 
  ConsolidatedItem, 
  GroupingStrategy,
  SpreadsheetSheet
} from '../types';
import { 
  Download, 
  Copy, 
  Printer, 
  Search, 
  Layers, 
  ListOrdered, 
  ArrowUpDown, 
  Tag, 
  Check, 
  FileSpreadsheet, 
  FolderLock, 
  HelpCircle,
  Eye,
  Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ConsolidationDashboardProps {
  consolidatedItems: ConsolidatedItem[];
  originalRows: ApparelOrderRow[];
  sheets: SpreadsheetSheet[];
  strategy: GroupingStrategy;
  onStrategyChange: (strategy: GroupingStrategy) => void;
  onResetData: () => void;
}

export function ConsolidationDashboard({ 
  consolidatedItems, 
  originalRows, 
  sheets, 
  strategy, 
  onStrategyChange,
  onResetData
}: ConsolidationDashboardProps) {
  const mapping = useMemo<ColumnMapping>(() => {
    return {
      itemName: 'itemName', // always true
      sku: sheets.some(s => s.mapping.sku !== '') ? 'sku' : '',
      size: sheets.some(s => s.mapping.size !== '') ? 'size' : '',
      color: sheets.some(s => s.mapping.color !== '') ? 'color' : '',
      category: sheets.some(s => s.mapping.category !== '') ? 'category' : '',
      quantity: 'quantity' // always true
    };
  }, [sheets]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'qty-desc' | 'qty-asc' | 'sku-asc' | 'name-asc'>('qty-desc');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCSV, setCopiedCSV] = useState(false);
  const [activeItemSources, setActiveItemSources] = useState<string | null>(null);

  // Extract unique categories for filter pills
  const categories = useMemo(() => {
    const cats = new Set<string>();
    consolidatedItems.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return ['all', ...Array.from(cats)].filter(c => c.trim() !== '');
  }, [consolidatedItems]);

  // Filter and sort items
  const processedItems = useMemo(() => {
    let result = [...consolidatedItems];

    // Filter by search text
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.itemName.toLowerCase().includes(q) || 
        item.sku.toLowerCase().includes(q) || 
        item.size.toLowerCase().includes(q) || 
        item.color.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(item => item.category === selectedCategory);
    }

    // Sort order
    result.sort((a, b) => {
      switch (sortBy) {
        case 'qty-desc':
          return b.totalQty - a.totalQty;
        case 'qty-asc':
          return a.totalQty - b.totalQty;
        case 'sku-asc':
          return a.sku.localeCompare(b.sku);
        case 'name-asc':
          return a.itemName.localeCompare(b.itemName);
        default:
          return 0;
      }
    });

    return result;
  }, [consolidatedItems, searchQuery, selectedCategory, sortBy]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    let original = 0;
    let buffer = 0;
    let total = 0;

    processedItems.forEach(item => {
      original += item.originalQty;
      buffer += item.bufferQty;
      total += item.totalQty;
    });

    return { original, buffer, total, uniqueLines: processedItems.length };
  }, [processedItems]);

  // Build the text script copied directly into clipboard
  const handleCopyVendorScript = () => {
    const headerLine = `======= APPAREL ORDER - CONSOLIDATED VENDOR WORKFLOW =======\nStrategy: Group by [${strategy.toUpperCase()}]\nTotal Pieces: ${aggregateStats.total}\n========================================================\n\n`;
    
    const lines = processedItems.map((item, idx) => {
      const skuStr = item.sku ? `SKU: ${item.sku}` : '';
      const sizeStr = item.size && item.size !== '-' && item.size !== 'All' ? `Size: ${item.size}` : '';
      const colorStr = item.color && item.color !== '-' && item.color !== 'All' ? `Color: ${item.color}` : '';
      const specs = [skuStr, colorStr, sizeStr].filter(s => s !== '').join(', ');
      
      return `${idx + 1}. Qty: ${item.totalQty}x  |  ${item.itemName} (${specs})`;
    }).join('\n');

    navigator.clipboard.writeText(headerLine + lines);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Export back as clean spreadsheet file
  const handleExportSpreadsheet = () => {
    // Generate simple array data
    const exportData = processedItems.map(item => ({
      "SKU/Reference": item.sku || 'N/A',
      "Garment Name": item.itemName,
      "Category": item.category || 'N/A',
      "Colorway": item.color || '-',
      "Size": item.size || '-',
      "Customer Request Pieces": item.originalQty,
      "Safety Buffer Pieces": item.bufferQty,
      "Total Pieces to Order": item.totalQty
    }));

    // Create SheetJS Worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Consolidated Order");
    
    // Auto-fit Columns Roughly
    const max_width = exportData.reduce((w, r) => Math.max(w, Object.values(r).join('').length / 4), 14);
    ws['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 22 }, { wch: 20 }, { wch: 22 }];

    // Trigger XLSX Write and Download
    XLSX.writeFile(wb, `Apparel_Order_Consolidation_${strategy}.xlsx`);
  };

  // Secondary CSV fallback download
  const handleExportCSV = () => {
    const csvHeader = "SKU/Reference,Garment Name,Category,Colorway,Size,Original Request,Buffer Added,Total Consolidated To Order\r\n";
    const csvRows = processedItems.map(item => {
      const safeName = `"${item.itemName.replace(/"/g, '""')}"`;
      const safeColor = `"${item.color.replace(/"/g, '""')}"`;
      return `${item.sku || 'N/A'},${safeName},${item.category || 'N/A'},${safeColor},${item.size || '-'},${item.originalQty},${item.bufferQty},${item.totalQty}`;
    }).join("\r\n");

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `consolidated_apparel_counts.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCopiedCSV(true);
    setTimeout(() => setCopiedCSV(false), 2000);
  };

  // Browser print window trigger
  const handlePrint = () => {
    window.print();
  };

  // Get source rows contributing to an identical consolidated combination line
  const getItemSources = (item: ConsolidatedItem) => {
    const sourceIds = new Set(item.sourceRowIds);
    return originalRows.filter(row => sourceIds.has(row.__id));
  };

  const activeSourceItem = consolidatedItems.find(item => item.id === activeItemSources);

  return (
    <div className="space-y-6">
      <div className="no-print bg-[#3E362E] text-white rounded-[24px] p-6 shadow-[0_4px_30px_rgba(62,54,46,0.06)] border border-[#2D2620]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-natural/60 font-mono">Consolidated Result Dashboard</span>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight leading-none mt-1">Consolidation Factory Sheet</h2>
            <p className="text-xs text-muted-natural/80 mt-2 font-sans">
              Combining <strong>{originalRows.length}</strong> individual spreadsheet lines into <strong>{aggregateStats.uniqueLines}</strong> unique item orders based on column mapping settings.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#51463D] hover:bg-[#605247] text-white text-xs font-semibold rounded-full transition cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Packing Slip
            </button>
            <button
              onClick={onResetData}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 text-rose-200 text-xs font-semibold rounded-full transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset App Data
            </button>
          </div>
        </div>

        {/* Dynamic Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#4E443A]">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-muted-natural/60 block uppercase font-mono tracking-wider">SKUs & Sizes Combos</span>
            <span className="text-2xl md:text-3xl font-serif font-bold text-[#F4EFE9]">{aggregateStats.uniqueLines}</span>
            <span className="text-[10px] text-muted-natural/40 block mt-1">Distinct dispatch items</span>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-muted-natural/60 block uppercase font-mono tracking-wider">Customer Requested</span>
            <span className="text-2xl md:text-3xl font-serif font-bold text-[#F4EFE9]">{aggregateStats.original}</span>
            <span className="text-[10px] text-muted-natural/40 block mt-1">Sum of original quantities</span>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-accent-natural block uppercase font-mono tracking-wider">Safety Buffer Units</span>
            <span className="text-2xl md:text-3xl font-serif font-bold text-[#EBE3D5]">+{aggregateStats.buffer}</span>
            <span className="text-[10px] text-muted-natural/40 block mt-1">Overhead reserve piece count</span>
          </div>

          <div className="p-4 bg-white/10 rounded-2xl border border-white/15 max-lg:col-span-2">
            <span className="text-[10px] text-emerald-300 block uppercase font-mono tracking-wider">Grand Total Vendor Order</span>
            <span className="text-2xl md:text-3xl font-serif font-bold text-emerald-300">{aggregateStats.total}</span>
            <span className="text-[10px] text-muted-natural/40 block mt-1 underline decoration-emerald-500/30 decoration-wavy">Units to manufacture / order</span>
          </div>
        </div>
      </div>

      {/* Control & Table Container */}
      <div className="bg-white rounded-[24px] border border-border-natural shadow-[0_4px_22px_rgba(62,54,46,0.03)] overflow-hidden p-6 space-y-5 print-card">
        {/* Print Only Header */}
        <div className="hidden print-only py-4 border-b border-black mb-6">
          <h1 className="text-2xl font-serif font-bold uppercase tracking-tight">Apparel Purchase Dispatch order</h1>
          <p className="text-xs text-neutral-600 mt-1">
            Consolidated from {originalRows.length} source order rows. Grouped by: {strategy.toUpperCase()}.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-4 bg-neutral-100 p-2 rounded text-xs font-mono">
            <div><strong>Unique Combinations:</strong> {aggregateStats.uniqueLines}</div>
            <div><strong>Requested Pieces:</strong> {aggregateStats.original}</div>
            <div><strong>Final Target Pieces:</strong> {aggregateStats.total}</div>
          </div>
        </div>

        {/* strategy & exporting tools */}
        <div className="no-print flex flex-col xl:flex-row justify-between xl:items-center gap-5 pb-5 border-b border-border-natural">
          {/* Strategy selector */}
          <div className="space-y-1.5 shrink-0">
            <span className="text-xs font-bold text-text-natural block uppercase tracking-wider font-sans">Grouping Strategy:</span>
            <div className="inline-flex rounded-full bg-cream-natural p-1 border border-border-natural flex-wrap gap-1">
              <button
                onClick={() => onStrategyChange('sku-size-color')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition shrink-0 cursor-pointer ${
                  strategy === 'sku-size-color'
                    ? 'bg-accent-natural text-white shadow-sm'
                    : 'text-text-natural/70 hover:text-text-natural hover:bg-[#FAF9F6]'
                }`}
              >
                SKU + Size + Color
              </button>
              <button
                onClick={() => onStrategyChange('item-size-color')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition shrink-0 cursor-pointer ${
                  strategy === 'item-size-color'
                    ? 'bg-accent-natural text-white shadow-sm'
                    : 'text-text-natural/70 hover:text-text-natural hover:bg-[#FAF9F6]'
                }`}
              >
                Item + Size + Color
              </button>
              <button
                onClick={() => onStrategyChange('item-size')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition shrink-0 cursor-pointer ${
                  strategy === 'item-size'
                    ? 'bg-accent-natural text-white shadow-sm'
                    : 'text-text-natural/70 hover:text-text-natural hover:bg-[#FAF9F6]'
                }`}
              >
                Item + Size
              </button>
              <button
                onClick={() => onStrategyChange('item-only')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition shrink-0 cursor-pointer ${
                  strategy === 'item-only'
                    ? 'bg-accent-natural text-white shadow-sm'
                    : 'text-text-natural/70 hover:text-text-natural hover:bg-[#FAF9F6]'
                }`}
              >
                Item Only
              </button>
            </div>
          </div>

          {/* Export toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyVendorScript}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cream-natural hover:bg-muted-natural text-text-natural text-xs font-bold rounded-full border border-border-natural transition cursor-pointer"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedScript ? 'Order Script Copied!' : 'Copy Factory Text Script'}
            </button>
            <button
              onClick={handleExportSpreadsheet}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-natural hover:opacity-90 text-white text-xs font-bold rounded-full transition cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download Consolidated (.xlsx)
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cream-natural hover:bg-muted-natural text-text-natural text-xs font-bold rounded-full border border-border-natural transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        </div>

        {/* Filters and search box */}
        <div className="no-print flex flex-col lg:flex-row justify-between lg:items-center gap-4 py-1">
          {/* Category tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[#A6998A] mr-1.5 uppercase font-bold font-sans tracking-wider">Category:</span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1 text-xs font-bold rounded-full border capitalize transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-accent-natural border-accent-natural text-white font-bold'
                    : 'bg-cream-natural border-border-natural text-text-natural/70 hover:bg-muted-natural'
                }`}
              >
                {cat === 'all' ? 'show all' : cat}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search items bar */}
            <div className="relative flex-1 sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A6998A]">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search SKU or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-sans rounded-xl border border-border-natural focus:outline-none focus:border-accent-natural bg-cream-natural hover:bg-cream-natural/80 transition"
              />
            </div>

            {/* Sorter selector */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs font-sans rounded-xl border border-border-natural focus:outline-none focus:border-accent-natural bg-cream-natural hover:bg-[#FAF9F6] transition cursor-pointer appearance-none"
              >
                <option value="qty-desc">Sort: Pieces (High → Low)</option>
                <option value="qty-asc">Sort: Pieces (Low → High)</option>
                <option value="sku-asc">Sort: SKU Code (A → Z)</option>
                <option value="name-asc">Sort: Garment Name (A → Z)</option>
              </select>
              <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-text-natural/40">
                <ArrowUpDown className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Aggregated Output Data Grid */}
        <div className="overflow-x-auto rounded-xl border border-border-natural">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-muted-natural text-text-natural font-bold border-b border-border-natural shadow-xs">
                {mapping.sku && <th className="p-3 pl-4">SKU / Reference</th>}
                <th className="p-3">Garment Item Name</th>
                {mapping.category && <th className="p-3">Category</th>}
                {mapping.color && strategy !== 'sku-only' && strategy !== 'item-size' && strategy !== 'item-only' && <th className="p-3">Colorway</th>}
                {mapping.size && strategy !== 'sku-only' && strategy !== 'item-only' && <th className="p-3">Size Key</th>}
                <th className="p-3 text-right">Customer Count</th>
                <th className="p-3 text-right text-accent-natural font-semibold">Safety Addition</th>
                <th className="p-3 text-right bg-cream-natural text-text-natural font-extrabold border-l border-border-natural pr-5">Total order Count</th>
                <th className="p-3 text-center no-print w-24">Review rows</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-natural text-text-natural-muted">
              {processedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-text-natural/50 font-medium font-sans">
                    No items found matching the current filters or sorting strategy. Try typing something else.
                  </td>
                </tr>
              ) : (
                processedItems.map(item => (
                  <tr key={item.id} className="hover:bg-muted-natural/30 transition group">
                    {mapping.sku && (
                      <td className="p-3 pl-4 font-mono font-medium text-text-natural/60 text-[11px]">
                        {item.sku || <span className="text-text-natural/30">N/A</span>}
                      </td>
                    )}
                    <td className="p-3 font-sans">
                      <div className="font-bold text-text-natural text-sm">{item.itemName}</div>
                    </td>
                    {mapping.category && (
                      <td className="p-3 font-sans">
                        <span className="px-2.5 py-0.5 rounded-full bg-cream-natural border border-border-natural text-text-natural/80 font-semibold text-[10px]">
                          {item.category || 'Uncategorized'}
                        </span>
                      </td>
                    )}
                    {mapping.color && strategy !== 'sku-only' && strategy !== 'item-size' && strategy !== 'item-only' && (
                      <td className="p-3 text-text-natural/80 font-sans">
                        {item.color || <span className="text-text-natural/30">-</span>}
                      </td>
                    )}
                    {mapping.size && strategy !== 'sku-only' && strategy !== 'item-only' && (
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-muted-natural text-accent-natural font-mono text-[11px] font-bold">
                          {item.size || <span className="text-text-natural/30">-</span>}
                        </span>
                      </td>
                    )}
                    <td className="p-3 text-right font-medium text-text-natural/70 font-sans">{item.originalQty} pcs</td>
                    <td className="p-3 text-right font-medium text-accent-natural font-sans">
                      {item.bufferQty > 0 ? `+${item.bufferQty} pcs` : 'Exact'}
                    </td>
                    <td className="p-3 text-right text-text-natural font-bold bg-[#FAF9F6] border-l border-border-natural pr-5 text-sm font-sans">
                      {item.totalQty} <span className="text-[10px] font-medium text-text-natural/50">pcs</span>
                    </td>
                    <td className="p-3 text-center no-print">
                      <button
                        onClick={() => setActiveItemSources(item.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-muted-natural text-text-natural/85 transition cursor-pointer"
                        title="View sheet trace files info for this item"
                      >
                        <Eye className="w-3.5 h-3.5 text-accent-natural" />
                        Trace
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Traces / row breakdown flyover or modal */}
      {activeItemSources && activeSourceItem && (
        <div className="fixed inset-0 bg-text-natural/45 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-xl w-full border border-border-natural shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-border-natural flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wide text-text-natural/50">Garment Source allocation Row Trace</span>
                <h4 className="text-sm font-bold text-text-natural font-serif mt-0.5">{activeSourceItem.itemName} ({activeSourceItem.sku || 'No SKU'})</h4>
              </div>
              <button 
                onClick={() => setActiveItemSources(null)}
                className="text-text-natural/40 hover:text-text-natural font-bold p-2 hover:bg-muted-natural rounded-lg text-lg transition"
              >
                &times;
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4 font-sans">
              <p className="text-xs text-text-natural/60 leading-normal">
                This item represents a sum total consolidated from the following customer sheet rows:
              </p>

              <div className="space-y-2.5">
                {getItemSources(activeSourceItem).map((row, idx) => {
                  const sheet = sheets?.find(s => s.id === row.__sheetId);
                  const sheetMap = sheet?.mapping;
                  const sizeVal = sheetMap?.size ? row[sheetMap.size] : activeSourceItem.size;
                  const colorVal = sheetMap?.color ? row[sheetMap.color] : activeSourceItem.color;
                  const qtyVal = sheetMap?.quantity ? row[sheetMap.quantity] : 0;
                  const sourceLabel = sheet ? `${sheet.fileName} • ${sheet.sheetName}` : 'Spreadsheet';

                  return (
                    <div key={idx} className="bg-cream-natural/60 p-3 rounded-xl border border-border-natural text-xs flex justify-between items-center bg-white/70">
                      <div>
                        {/* Try to display a helpful retailer name or code row */}
                        <div className="font-bold text-text-natural/90 flex flex-wrap items-center gap-1.5">
                          <span>{row["Retailer Name"] || row["Customer"] || row["Store"] || row["Client"] || row["Name"] || `Pasted row #${idx + 1}`}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-[#FAF9F6] text-accent-natural border border-border-natural text-[9px] font-mono font-semibold shrink-0">
                            {sourceLabel}
                          </span>
                        </div>
                        <div className="text-[10px] text-text-natural/50 space-x-2 mt-0.5 font-mono">
                          {activeSourceItem.size && activeSourceItem.size !== '-' && <span>Size: {sizeVal || '-'}</span>}
                          {activeSourceItem.color && activeSourceItem.color !== '-' && <span>Color: {colorVal || '-'}</span>}
                        </div>
                      </div>
                      <div className="font-mono text-xs font-bold text-text-natural">
                        {qtyVal || 0} pcs
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-cream-natural border-t border-border-natural flex justify-end font-sans">
              <button
                onClick={() => setActiveItemSources(null)}
                className="px-5 py-2 bg-accent-natural hover:opacity-90 text-white rounded-full text-xs font-medium transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
