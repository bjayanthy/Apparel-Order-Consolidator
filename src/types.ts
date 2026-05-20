/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ApparelOrderRow {
  __id: string; // Unique row ID added by front-end
  [key: string]: any;
}

export interface ColumnMapping {
  itemName: string;
  sku: string;
  size: string;
  color: string;
  quantity: string;
  category: string;
}

export interface SpreadsheetSheet {
  id: string;
  fileName: string;
  sheetName: string;
  headers: string[];
  rows: ApparelOrderRow[];
  mapping: ColumnMapping;
}

export type GroupingStrategy = 
  | 'sku-size-color'  // Fully granular: SKU + Size + Color (Default)
  | 'item-size-color' // Item Name + Size + Color
  | 'sku-only'        // SKU code only
  | 'item-size'       // Item Name + Size
  | 'item-only';      // Item Name only

export interface SafetyStockSettings {
  globalType: 'percentage' | 'fixed';
  globalValue: number;
  itemOverrides: Record<string, { type: 'percentage' | 'fixed'; value: number }>; // keyed by item's composite group key or SKU
}

export interface ConsolidatedItem {
  id: string; // Composite key or unique ID
  sku: string;
  itemName: string;
  size: string;
  color: string;
  category: string;
  originalQty: number;
  bufferQty: number;
  totalQty: number;
  sourceRowIds: string[];
  notes?: string;
}

export interface ExampleDataset {
  name: string;
  description: string;
  headers: string[];
  rows: Record<string, string | number>[];
  defaultMapping: Partial<ColumnMapping>;
}
