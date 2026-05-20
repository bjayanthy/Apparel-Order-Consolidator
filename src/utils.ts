/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApparelOrderRow, ColumnMapping, ConsolidatedItem, GroupingStrategy, SafetyStockSettings, SpreadsheetSheet } from './types';

/**
 * Parses TSV/CSV copied and pasted directly from spreadsheet tools like Google Sheets or Microsoft Excel.
 */
export function parsePastedSpreadsheet(text: string): { headers: string[]; rows: Record<string, string | number>[] } {
  if (!text || !text.trim()) {
    return { headers: [], rows: [] };
  }

  // Split lines
  const lines = text.split(/\r?\n/);
  const rowsRaw: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Detect TSV vs CSV
    let cells: string[] = [];
    if (line.includes('\t')) {
      cells = line.split('\t');
    } else {
      // Basic CSV splitting (handling quoted values roughly)
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

  if (rowsRaw.length === 0) {
    return { headers: [], rows: [] };
  }

  // Assume first row is headers
  const headers = rowsRaw[0].map(h => h.trim()).filter(h => h !== '');
  const rows: Record<string, string | number>[] = [];

  for (let i = 1; i < rowsRaw.length; i++) {
    const cells = rowsRaw[i];
    const rowObj: Record<string, string | number> = {};
    
    // Fill row cells based on headers
    headers.forEach((h, colIndex) => {
      const cellVal = cells[colIndex] !== undefined ? cells[colIndex].trim() : '';
      
      // Attempt to convert to number if it fits
      if (cellVal !== '' && !isNaN(Number(cellVal))) {
        rowObj[h] = Number(cellVal);
      } else {
        rowObj[h] = cellVal;
      }
    });

    // Make sure the row has some data
    if (Object.values(rowObj).some(val => val !== '')) {
      rows.push(rowObj);
    }
  }

  return { headers, rows };
}

/**
 * Automatically inspects headers to suggest mappings for Apparel order worksheets.
 */
export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    itemName: '',
    sku: '',
    size: '',
    color: '',
    quantity: '',
    category: ''
  };

  const lowerHeaders = headers.map(h => h.toLowerCase());

  // Search for Quantity
  const qtyKeywords = ['qty', 'quantity', 'count', 'units', 'booking', 'order', 'pieces', 'vol', 'volume', 'amount'];
  // Look for exact matches first
  let foundQtyIdx = lowerHeaders.findIndex(h => h === 'qty' || h === 'quantity' || h === 'count');
  if (foundQtyIdx === -1) {
    // Look for partial matches
    foundQtyIdx = lowerHeaders.findIndex(h => qtyKeywords.some(kw => h.includes(kw)));
  }
  if (foundQtyIdx !== -1) mapping.quantity = headers[foundQtyIdx];

  // Search for Item Name
  const nameKeywords = ['item', 'product', 'design', 'style name', 'garment', 'description', 'name', 'article', 'apparel'];
  let foundNameIdx = lowerHeaders.findIndex(h => h === 'item' || h === 'description' || h === 'product' || h === 'item name' || h === 'garment name');
  if (foundNameIdx === -1) {
    foundNameIdx = lowerHeaders.findIndex(h => nameKeywords.some(kw => h.includes(kw)));
  }
  if (foundNameIdx !== -1) mapping.itemName = headers[foundNameIdx];

  // Search for SKU
  const skuKeywords = ['sku', 'style id', 'style ref', 'code', 'style #', 'style code', 'reference', 'model', 'id', 'upc', 'barcode'];
  let foundSkuIdx = lowerHeaders.findIndex(h => h === 'sku' || h === 'style ref' || h === 'style code' || h === 'model code');
  if (foundSkuIdx === -1) {
    foundSkuIdx = lowerHeaders.findIndex(h => skuKeywords.some(kw => h.includes(kw)));
  }
  if (foundSkuIdx !== -1) mapping.sku = headers[foundSkuIdx];

  // Search for Size
  const sizeKeywords = ['size', 'sizing', 'waist', 'fit', 'dims'];
  let foundSizeIdx = lowerHeaders.findIndex(h => h === 'size' || h === 'sizing');
  if (foundSizeIdx === -1) {
    foundSizeIdx = lowerHeaders.findIndex(h => sizeKeywords.some(kw => h.includes(kw)));
  }
  if (foundSizeIdx !== -1) mapping.size = headers[foundSizeIdx];

  // Search for Color
  const colorKeywords = ['color', 'colour', 'colorway', 'shade', 'pattern', 'fabric', 'wash'];
  let foundColorIdx = lowerHeaders.findIndex(h => h === 'color' || h === 'colour' || h === 'colorway' || h === 'wash');
  if (foundColorIdx === -1) {
    foundColorIdx = lowerHeaders.findIndex(h => colorKeywords.some(kw => h.includes(kw)));
  }
  if (foundColorIdx !== -1) mapping.color = headers[foundColorIdx];

  // Search for Category
  const catKeywords = ['category', 'dept', 'department', 'type', 'section', 'vendor', 'supplier'];
  let foundCatIdx = lowerHeaders.findIndex(h => h === 'category' || h === 'dept' || h === 'department' || h === 'supplier category');
  if (foundCatIdx === -1) {
    foundCatIdx = lowerHeaders.findIndex(h => catKeywords.some(kw => h.includes(kw)));
  }
  if (foundCatIdx !== -1) mapping.category = headers[foundCatIdx];

  // Fallbacks if some are empty but others are available
  const unmapped = headers.filter(h => !Object.values(mapping).includes(h));
  if (!mapping.itemName && unmapped.length > 0) {
    mapping.itemName = unmapped[0];
  }
  if (!mapping.quantity && unmapped.length > 0) {
    // Look for any header that has mostly numbers in the actual rows (would be handled at component level or bind first number-ish)
    mapping.quantity = unmapped.find(h => h.toLowerCase().includes('qty') || h.toLowerCase().includes('count')) || unmapped[unmapped.length - 1];
  }

  return mapping;
}

/**
 * Consolidate rows based on the selected strategies & mappings.
 */
export function consolidateOrders(
  sheets: SpreadsheetSheet[],
  strategy: GroupingStrategy,
  safetySettings: SafetyStockSettings
): ConsolidatedItem[] {
  if (!sheets || sheets.length === 0) {
    return [];
  }

  const consolidatedMap: Record<string, ConsolidatedItem> = {};

  sheets.forEach(sheet => {
    const mapping = sheet.mapping;
    if (!mapping.itemName || !mapping.quantity) {
      // Skip sheet if it does not have the mandatory fields mapped
      return;
    }

    sheet.rows.forEach(row => {
      // Extract values matching mapping structure
      const itemName = String(row[mapping.itemName] || '').trim();
      const rawSku = mapping.sku ? String(row[mapping.sku] || '').trim() : '';
      const sku = rawSku;
      
      const size = mapping.size ? String(row[mapping.size] || '').trim() : '';
      const color = mapping.color ? String(row[mapping.color] || '').trim() : '';
      const category = mapping.category ? String(row[mapping.category] || '').trim() : 'Uncategorized';
      
      // Parse quantity
      let qty = 0;
      const rawQty = row[mapping.quantity];
      if (typeof rawQty === 'number') {
        qty = rawQty;
      } else {
        const parsed = parseInt(String(rawQty || '0').replace(/[^0-9.-]/g, ''), 10);
        qty = isNaN(parsed) ? 0 : parsed;
      }

      // Skip zero or negative values if they shouldn't count, but standard is positive quantity
      if (qty <= 0) return;

      // Build compound identity based on Grouping Strategy
      let compositeKey = '';
      let finalItemName = itemName;
      let finalSku = sku;
      let finalSize = size;
      let finalColor = color;

      switch (strategy) {
        case 'sku-size-color':
          compositeKey = `sku:${sku || 'NOSKU'}|size:${size || 'NOSIZE'}|color:${color || 'NOCOLOR'}|item:${itemName}`;
          break;
        case 'item-size-color':
          compositeKey = `item:${itemName}|size:${size || 'NOSIZE'}|color:${color || 'NOCOLOR'}`;
          finalSku = sku || 'N/A';
          break;
        case 'sku-only':
          compositeKey = `sku:${sku || 'NOSKU'}`;
          finalSize = 'All';
          finalColor = 'All';
          break;
        case 'item-size':
          compositeKey = `item:${itemName}|size:${size || 'NOSIZE'}`;
          finalColor = 'All';
          finalSku = sku || 'N/A';
          break;
        case 'item-only':
          compositeKey = `item:${itemName}`;
          finalSize = 'All';
          finalColor = 'All';
          finalSku = sku || 'N/A';
          break;
        default:
          compositeKey = `${itemName}-${sku}-${size}-${color}`;
      }

      if (!compositeKey.trim() || compositeKey === 'sku:NOSKU|size:NOSIZE|color:NOCOLOR|item:') {
        // Avoid blank trash keys
        return;
      }

      if (consolidatedMap[compositeKey]) {
        consolidatedMap[compositeKey].originalQty += qty;
        consolidatedMap[compositeKey].sourceRowIds.push(row.__id);
        
        // Keep category merged if not already set
        if (consolidatedMap[compositeKey].category === 'Uncategorized' && category !== 'Uncategorized') {
          consolidatedMap[compositeKey].category = category;
        }
        if (!consolidatedMap[compositeKey].sku && sku) {
          consolidatedMap[compositeKey].sku = sku;
        }
      } else {
        consolidatedMap[compositeKey] = {
          id: compositeKey,
          sku: finalSku || '',
          itemName: finalItemName || 'Unnamed Item',
          size: finalSize || '-',
          color: finalColor || '-',
          category: category || 'Uncategorized',
          originalQty: qty,
          bufferQty: 0, // Calculated below
          totalQty: qty, // Calculated below
          sourceRowIds: [row.__id]
        };
      }
    });
  });

  // Now apply Safety Stock Calculations
  return Object.values(consolidatedMap).map(item => {
    // Check if there is an override for this item SKU/id
    const override = safetySettings.itemOverrides[item.sku] || safetySettings.itemOverrides[item.id];
    
    let bufferVal = 0;
    const type = override ? override.type : safetySettings.globalType;
    const value = override ? override.value : safetySettings.globalValue;

    if (value > 0) {
      if (type === 'percentage') {
        bufferVal = Math.ceil(item.originalQty * (value / 100));
      } else {
        bufferVal = value;
      }
    }

    return {
      ...item,
      bufferQty: bufferVal,
      totalQty: item.originalQty + bufferVal
    };
  });
}
