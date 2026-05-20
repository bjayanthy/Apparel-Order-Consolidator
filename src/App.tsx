/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  ApparelOrderRow, 
  ColumnMapping, 
  GroupingStrategy, 
  SafetyStockSettings,
  SpreadsheetSheet
} from './types';
import { EXAMPLES } from './data/mockData';
import { consolidateOrders, autoDetectMapping } from './utils';
import { MappingControls } from './components/MappingControls';
import { SafetyStockPanel } from './components/SafetyStockPanel';
import { DataPreviewTable } from './components/DataPreviewTable';
import { ConsolidationDashboard } from './components/ConsolidationDashboard';
import { ManualPasteModal } from './components/ManualPasteModal';
import { 
  FileSpreadsheet, 
  Upload, 
  PlusCircle, 
  ArrowRight, 
  FolderSync, 
  AlertCircle,
  Scissors, 
  CheckCircle, 
  BookOpen,
  ShoppingBag,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';

export default function App() {
  const [sheets, setSheets] = useState<SpreadsheetSheet[]>([]);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  
  const [strategy, setStrategy] = useState<GroupingStrategy>('sku-size-color');
  const [safetySettings, setSafetySettings] = useState<SafetyStockSettings>({
    globalType: 'percentage',
    globalValue: 0,
    itemOverrides: {}
  });

  const [activePasteModal, setActivePasteModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSheet = useMemo(() => {
    return sheets.find(s => s.id === activeSheetId) || sheets[0] || null;
  }, [sheets, activeSheetId]);

  // Trigger file upload read
  const processFile = (file: File) => {
    setUploadError(null);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const dataBytes = e.target?.result;
        const workbook = XLSX.read(dataBytes, { type: 'binary', cellFormula: false, cellHTML: false, cellText: false });
        
        if (workbook.SheetNames.length === 0) {
          throw new Error("Excel worksheet has no valid sheet tabs named.");
        }

        const parsedSheets: SpreadsheetSheet[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          
          // Output headers as a matrix array
          const rawJson = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          if (rawJson.length === 0) return; // Skip empty sheets

          const excelHeaders = (rawJson[0] as any[] || []).map(h => String(h || '').trim()).filter(h => h !== '');
          if (excelHeaders.length === 0) return; // Skip if no header columns

          const excelRows: Record<string, string | number>[] = [];
          
          for (let i = 1; i < rawJson.length; i++) {
            const rowArray = rawJson[i];
            if (!rowArray || rowArray.length === 0) continue;

            const rowObj: Record<string, string | number> = {};
            let rowHasValues = false;

            excelHeaders.forEach((h, index) => {
              const rawValue = rowArray[index];
              if (rawValue !== undefined && rawValue !== null) {
                const cleanedStr = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
                if (cleanedStr !== '') {
                  rowHasValues = true;
                  rowObj[h] = isNaN(Number(cleanedStr)) ? cleanedStr : Number(cleanedStr);
                } else {
                  rowObj[h] = '';
                }
              } else {
                rowObj[h] = '';
              }
            });

            if (rowHasValues) {
              excelRows.push(rowObj);
            }
          }

          if (excelRows.length > 0) {
            const sheetId = `sheet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const autoMap = autoDetectMapping(excelHeaders);
            parsedSheets.push({
              id: sheetId,
              fileName: file.name,
              sheetName: sheetName,
              headers: excelHeaders,
              rows: excelRows.map((r, rIdx) => ({
                ...r,
                __id: `row_${sheetId}_${rIdx}`,
                __sheetId: sheetId
              })),
              mapping: autoMap
            });
          }
        });

        if (parsedSheets.length === 0) {
          throw new Error("No data rows with valid cell outputs were parsed from the selected spreadsheet file.");
        }

        setSheets(prev => {
          const updated = [...prev, ...parsedSheets];
          return updated;
        });

        setActiveSheetId(parsedSheets[0].id);
        setUploadError(null);

      } catch (err: any) {
        setUploadError(err.message || "Failed to process the Excel/CSV file details. Ensure it is not corrupted.");
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Drag and drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Copy paste parsing receiver
  const handleDataParsed = (pastedHeaders: string[], pastedRows: Record<string, string | number>[]) => {
    const sheetId = `pasted_${Date.now()}`;
    const autoMap = autoDetectMapping(pastedHeaders);
    const newSheet: SpreadsheetSheet = {
      id: sheetId,
      fileName: 'Pasted Grid Data',
      sheetName: `Pasted ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      headers: pastedHeaders,
      rows: pastedRows.map((r, i) => ({
        ...r,
        __id: `row_${sheetId}_${i}`,
        __sheetId: sheetId
      })),
      mapping: autoMap
    };

    setSheets(prev => [...prev, newSheet]);
    setActiveSheetId(sheetId);
    setUploadError(null);
  };

  // Load a demonstration dataset
  const handleLoadExample = (example: typeof EXAMPLES[0]) => {
    const sheetId = `example_${Date.now()}`;
    const newSheet: SpreadsheetSheet = {
      id: sheetId,
      fileName: example.name,
      sheetName: 'All Units',
      headers: example.headers,
      rows: example.rows.map((r, i) => ({
        ...r,
        __id: `row_${sheetId}_${i}`,
        __sheetId: sheetId
      })),
      mapping: example.defaultMapping as ColumnMapping
    };

    setSheets([newSheet]);
    setActiveSheetId(sheetId);
    setUploadError(null);
  };

  // Delete individual raw spreadsheet preview row
  const handleDeleteRow = (sheetId: string, rowId: string) => {
    setSheets(prev => prev.map(s => {
      if (s.id === sheetId) {
        return {
          ...s,
          rows: s.rows.filter(r => r.__id !== rowId)
        };
      }
      return s;
    }).filter(s => s.rows.length > 0));
  };

  // Remove individual spreadsheet source entirely
  const handleRemoveSheet = (id: string) => {
    setSheets(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (activeSheetId === id) {
        if (filtered.length > 0) {
          setActiveSheetId(filtered[0].id);
        } else {
          setActiveSheetId(null);
        }
      }
      return filtered;
    });
  };

  // Clear everything to restart
  const handleResetData = () => {
    setSheets([]);
    setActiveSheetId(null);
    setSafetySettings({
      globalType: 'percentage',
      globalValue: 0,
      itemOverrides: {}
    });
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Update specific sheet's mapping
  const handleUpdateActiveMapping = (newMapping: ColumnMapping) => {
    if (!activeSheet) return;
    setSheets(prev => prev.map(s => s.id === activeSheet.id ? { ...s, mapping: newMapping } : s));
  };

  // Apply active mapping format to all sheets
  const handleApplyMappingToAll = () => {
    if (!activeSheet) return;
    setSheets(prev => prev.map(s => ({
      ...s,
      mapping: { ...activeSheet.mapping }
    })));
  };

  // Run consolidation instantly across ALL loaded sheet sources
  const consolidatedItems = useMemo(() => {
    return consolidateOrders(sheets, strategy, safetySettings);
  }, [sheets, strategy, safetySettings]);

  // Combined flat rows list for tracer popup mapping in dashboard
  const allCombinedRows = useMemo(() => {
    return sheets.flatMap(s => s.rows);
  }, [sheets]);

  // Aggregate stats totals across multiple sources
  const totalOriginalQty = useMemo(() => {
    return sheets.reduce((sum, s) => {
      const qCol = s.mapping.quantity;
      if (!qCol) return sum;
      return sum + s.rows.reduce((sSum, row) => {
        let qty = 0;
        const rawQty = row[qCol];
        if (typeof rawQty === 'number') {
          qty = rawQty;
        } else {
          const parsed = parseInt(String(rawQty || '0').replace(/[^0-9.-]/g, ''), 10);
          qty = isNaN(parsed) ? 0 : parsed;
        }
        return sSum + (qty > 0 ? qty : 0);
      }, 0);
    }, 0);
  }, [sheets]);

  const totalConsolidatedQty = useMemo(() => {
    return consolidatedItems.reduce((sum, item) => sum + item.totalQty, 0);
  }, [consolidatedItems]);

  const hasDataLoaded = sheets.length > 0;
  const isMappingValid = useMemo(() => {
    return sheets.length > 0 && sheets.some(s => s.mapping.itemName && s.mapping.quantity);
  }, [sheets]);

  return (
    <div className="min-h-screen bg-bg-natural text-text-natural selection:bg-accent-natural selection:text-white pb-16">
      {/* Upper Brand Ribbon */}
      <header className="no-print bg-white border-b border-border-natural sticky top-0 z-40 shadow-[0_1px_10px_rgba(62,54,46,0.02)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-natural flex items-center justify-center text-white shrink-0 shadow-sm">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl italic font-semibold text-accent-natural key-titleid">The Coordinator's Desk</h1>
              <p className="text-[10px] uppercase tracking-widest text-text-natural/60 font-sans">Multi-Sheet Inventory & Order Consolidation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-5 text-xs text-text-natural font-sans">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">Apparel Dispatch</p>
              <p className="text-[10px] text-accent-natural font-mono">Platform Multi-File Workspace</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-muted-natural border border-border-natural flex items-center justify-center text-accent-natural font-bold text-xs">AD</div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-10 space-y-8">
        {/* Pitch Hero Panel */}
        <div className="no-print bg-white rounded-[24px] border border-border-natural px-8 py-10 shadow-[0_4px_22px_rgba(62,54,46,0.03)] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-accent-natural bg-muted-natural uppercase tracking-wider rounded-md font-sans">
              Clothing Coordinator Multi-Source Tool
            </div>
            <h2 id="hero-title" className="text-3xl md:text-4xl font-serif font-medium tracking-tight text-text-natural leading-tight">
              Order Consolidation Hub
            </h2>
            <p className="text-xs text-text-natural/80 leading-relaxed font-sans mt-2">
              Our app combines input from **2 or more excel sheets** to create consolidated summaries and count of each item that needs to be ordered. Map column headers per-sheet to support mixed formats, adjust custom manufacturer safety stock, and inspect traces instantly.
            </p>
          </div>

          {!hasDataLoaded && (
            <div className="shrink-0 flex flex-col gap-2 bg-muted-natural/30 p-4 rounded-2xl border border-border-natural">
              <span className="text-[10px] text-text-natural/60 font-bold uppercase tracking-wider block mb-1">Interactive Sandbox:</span>
              <button
                id="btn-load-summer"
                onClick={() => handleLoadExample(EXAMPLES[0])}
                className="px-5 py-2.5 text-xs font-semibold text-left border border-border-natural text-text-natural bg-white hover:bg-muted-natural rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-accent-natural" />
                <span>Load Summer Boutique Demo</span>
              </button>
              <button
                id="btn-load-winter"
                onClick={() => handleLoadExample(EXAMPLES[1])}
                className="px-5 py-2.5 text-xs font-semibold text-left border border-border-natural text-text-natural bg-white hover:bg-muted-natural rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-accent-natural" />
                <span>Load Winter Suppliers Demo</span>
              </button>
            </div>
          )}
        </div>

        {/* Input Phase: No Data State */}
        {!hasDataLoaded ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* File Dropzone Box */}
            <div className="lg:col-span-8">
              <div
                id="dropzone-box"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[32px] p-12 text-center flex flex-col items-center justify-center cursor-pointer transition relative h-96 [box-shadow:0_4px_20px_rgba(62,54,46,0.03)] ${
                  dragActive 
                    ? 'border-accent-natural bg-muted-natural/40' 
                    : 'border-sand-natural hover:border-accent-natural bg-white'
                }`}
              >
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="p-4 bg-muted-natural rounded-full text-accent-natural mb-4">
                  <Upload className="w-8 h-8" />
                </div>

                <h3 className="serif text-xl mb-2 text-text-natural">Upload spreadsheets (xlsx, xls, csv)</h3>
                <p className="text-xs text-text-natural/60 max-w-sm mx-auto mt-1.5 leading-normal">
                  Drop your Microsoft Excel sheets here (handles workbooks with multiple sheet tabs, or upload them sequentially to accumulate counts!).
                </p>

                <div className="flex gap-4 mt-6">
                  <span className="text-[10px] bg-muted-natural text-accent-natural px-2.5 py-1 rounded-md font-mono font-semibold">Multiple Sheet Upload</span>
                  <span className="text-[10px] bg-muted-natural text-accent-natural px-2.5 py-1 rounded-md font-mono font-semibold">Separate Header Mappings</span>
                  <span className="text-[10px] bg-muted-natural text-accent-natural px-2.5 py-1 rounded-md font-mono font-semibold">Aggregated Dispatch List</span>
                </div>
              </div>
            </div>

            {/* Paste columns box / instructions */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-[24px] p-6 border border-border-natural [box-shadow:0_4px_20px_rgba(62,54,46,0.03)] flex-1 flex flex-col justify-between">
                <div>
                  <div className="p-3 w-12 h-12 rounded-xl bg-muted-natural text-accent-natural mb-4 flex items-center justify-center">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs uppercase tracking-wider font-bold mb-1 text-text-natural/85 font-sans">Pasted Data Input</h3>
                  <p className="text-xs text-text-natural/60 leading-relaxed font-sans">
                    Have rows already open in active Excel sheets? Avoid exporting files entirely. Click below, copy the grid lines with your keyboard, and paste inside our analyzer instantly.
                  </p>
                </div>
                
                <button
                  id="btn-paste-cells"
                  type="button"
                  onClick={() => setActivePasteModal(true)}
                  className="w-full mt-6 py-2.5 text-xs text-center font-semibold text-white bg-accent-natural hover:opacity-90 rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm font-sans cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Paste Excel Cells (Ctrl+V)
                </button>
              </div>

              {/* Offline safety card */}
              <div className="bg-[#3E362E] border border-[#2D2620] text-neutral-200 rounded-[24px] p-6 flex flex-col justify-between relative overflow-hidden [box-shadow:0_4px_20px_rgba(62,54,46,0.05)]">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-natural font-sans">100% Client-Side Privacy</h4>
                  <p className="text-[11px] text-muted-natural/80 leading-normal">
                    This browser workspace processes all file charts directly inside your local computer memory. No client designs, cost calculations, or sensitive order records are ever uploaded to any servers.
                  </p>
                </div>
                <div className="border-t border-[#4E443A] pt-3 mt-4 flex items-center gap-2 text-[10px] text-muted-natural/50">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Offline Secure Safe</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Process Phase: Active Data State */
          <div className="space-y-6">
            {/* Sheet Sources List */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="no-print bg-white rounded-[24px] border border-border-natural shadow-[0_4px_22px_rgba(62,54,46,0.03)] p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border-natural pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#EBE3D5] text-accent-natural">
                    <FolderSync className="w-5 h-5 text-accent-natural" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-text-natural">Loaded Excel/CSV Sources ({sheets.length})</h3>
                    <p className="text-xs text-text-natural/60 font-sans">Combine counts from multiple excel sheets. Click any card to map or preview its rows.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    id="btn-add-file"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-cream-natural hover:bg-muted-natural border border-border-natural text-accent-natural text-xs font-bold rounded-full transition cursor-pointer shrink-0"
                  >
                    + Add Spreadsheet File
                  </button>
                  <button
                    id="btn-add-paste"
                    onClick={() => setActivePasteModal(true)}
                    className="px-4 py-2 bg-cream-natural hover:bg-muted-natural border border-border-natural text-accent-natural text-xs font-bold rounded-full transition cursor-pointer shrink-0"
                  >
                    + Paste Excel Rows
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sheets.map(sheet => {
                  const isSelected = activeSheet && sheet.id === activeSheet.id;
                  const isMapped = sheet.mapping.itemName && sheet.mapping.quantity;

                  return (
                    <div
                      key={sheet.id}
                      onClick={() => setActiveSheetId(sheet.id)}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer relative group flex flex-col justify-between ${
                        isSelected
                          ? 'border-accent-natural bg-accent-natural/[0.01]'
                          : 'border-border-natural bg-white hover:border-accent-natural/40'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <div className="flex gap-2.5 items-center overflow-hidden">
                            <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-accent-natural text-white' : 'bg-cream-natural text-accent-natural'}`}>
                              <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <div className="overflow-hidden">
                              <h4 className="font-serif font-bold text-sm text-text-natural truncate" title={sheet.fileName}>
                                {sheet.fileName}
                              </h4>
                              <p className="text-[10px] text-accent-natural font-mono truncate">
                                Sheet: {sheet.sheetName}
                              </p>
                            </div>
                          </div>
                          {/* Delete source button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSheet(sheet.id);
                            }}
                            className="text-[#A6998A] hover:text-rose-600 p-1 rounded hover:bg-rose-50/50 transition cursor-pointer shrink-0 opacity-40 group-hover:opacity-100 font-bold text-lg"
                            title="Remove this spreadsheet sheet"
                          >
                            &times;
                          </button>
                        </div>

                        <p className="text-xs text-text-natural/60 font-sans mt-2">
                          Contains <strong>{sheet.rows.length}</strong> loaded customer rows.
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border-natural/50 flex items-center justify-between text-[11px]">
                        {isMapped ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Columns Connected
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Relation configuration required
                          </span>
                        )}

                        {isSelected && (
                          <span className="text-[10px] font-bold text-accent-natural bg-[#EBE3D5] px-2 py-0.5 rounded">
                            Active Map Editor
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Step 1: Mapping Binder */}
            {activeSheet && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="no-print">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-muted-natural/35 rounded-2xl border border-border-natural/60 gap-4">
                    <div className="text-xs text-text-natural/80 font-sans">
                      <span>Currently configuring headers for: </span>
                      <strong className="text-accent-natural font-serif">{activeSheet.fileName} &gt; {activeSheet.sheetName}</strong>
                    </div>
                    {sheets.length > 1 && (
                      <button
                        id="btn-apply-all-maps"
                        onClick={handleApplyMappingToAll}
                        className="text-xs font-bold text-white bg-accent-natural hover:opacity-95 px-4 py-1.5 rounded-full cursor-pointer transition shadow-xs font-sans shrink-0 cursor-pointer"
                        title="Copy this columns configuration to all other sheet sources instantly"
                      >
                        Apply this Column Mapping format to All Sheets
                      </button>
                    )}
                  </div>
                  <MappingControls 
                    headers={activeSheet.headers} 
                    mapping={activeSheet.mapping} 
                    onChange={handleUpdateActiveMapping} 
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Safety stock / buffer options */}
            {isMappingValid && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="no-print">
                <SafetyStockPanel 
                  settings={safetySettings} 
                  onChange={setSafetySettings}
                  totalOriginalQty={totalOriginalQty}
                  totalConsolidatedQty={totalConsolidatedQty}
                />
              </motion.div>
            )}

            {/* Step 3: Raw sheets inspector preview */}
            {activeSheet && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="no-print">
                <DataPreviewTable 
                  headers={activeSheet.headers} 
                  rows={activeSheet.rows} 
                  onDeleteRow={(rowId) => handleDeleteRow(activeSheet.id, rowId)}
                  onClearAll={() => handleRemoveSheet(activeSheet.id)}
                />
              </motion.div>
            )}

            {/* Step 4: Final Consolidation Dashboard output grid */}
            {isMappingValid ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <ConsolidationDashboard 
                  consolidatedItems={consolidatedItems}
                  originalRows={allCombinedRows}
                  sheets={sheets}
                  strategy={strategy}
                  onStrategyChange={setStrategy}
                  onResetData={handleResetData}
                />
              </motion.div>
            ) : (
              <div className="no-print bg-neutral-100 rounded-2xl border border-neutral-200/60 p-12 text-center text-neutral-500 font-sans text-xs">
                <Info className="w-6 h-6 mx-auto text-neutral-400 mb-2" />
                <span>Assign the required columns in <strong>Step 1</strong> for your spreadsheets to generate the consolidation dashboard here.</span>
              </div>
            )}
          </div>
        )}

        {/* Global Error Banner */}
        {uploadError && (
          <div className="no-print bg-rose-50 border border-rose-100 text-rose-800 text-xs p-4 rounded-xl flex items-start gap-3 mt-4 font-sans">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Spreadsheet Import Failure:</span>
              <p>{uploadError}</p>
            </div>
          </div>
        )}

        {/* Modular Paste Modal Popup Dialog */}
        <ManualPasteModal 
          isOpen={activePasteModal}
          onClose={() => setActivePasteModal(false)}
          onDataParsed={handleDataParsed}
        />
      </main>
    </div>
  );
}
