/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ApparelOrderRow } from '../types';
import { Trash, Eye, Info, Search, FileSpreadsheet } from 'lucide-react';

interface DataPreviewTableProps {
  headers: string[];
  rows: ApparelOrderRow[];
  onDeleteRow: (id: string) => void;
  onClearAll: () => void;
}

export function DataPreviewTable({ headers, rows, onDeleteRow, onClearAll }: DataPreviewTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Local filtering simple search
  const filteredRows = rows.filter(row => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white rounded-[24px] border border-border-natural shadow-[0_4px_22px_rgba(62,54,46,0.03)] p-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-3 border-b border-border-natural">
        <div className="flex items-center gap-3">
          <div className="p-2 ml-0.5 rounded-xl bg-accent-natural text-white">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-text-natural flex items-center gap-2">
              Imported Spreadsheet Preview
              <span className="text-xs bg-muted-natural text-accent-natural px-2.5 py-0.5 rounded-full font-bold">
                {rows.length} rows loaded
              </span>
            </h3>
            <p className="text-xs text-text-natural/60">
              Verify your spreadsheet content below. You can search or remove single line rows.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick search inside raw data */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-natural/40">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search raw rows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8.5 pr-4 py-1.5 text-xs font-sans rounded-xl border border-border-natural focus:outline-none focus:border-accent-natural bg-cream-natural hover:bg-muted-natural/50 transition sm:w-48"
            />
          </div>

          <button
            onClick={onClearAll}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50/50 px-3 py-1.5 rounded-full border border-rose-200 transition cursor-pointer"
          >
            Clear Data
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-72 rounded-xl border border-border-natural bg-[#FAF9F6]">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="bg-muted-natural text-text-natural font-semibold border-b border-border-natural sticky top-0">
              <th className="p-2.5 pl-4 text-center text-text-natural/50 w-10">#</th>
              {headers.map((h, i) => (
                <th key={i} className="p-2.5 font-sans font-bold text-text-natural whitespace-nowrap">
                  {h}
                </th>
              ))}
              <th className="p-2.5 text-center text-text-natural/50 w-12 sticky right-0 bg-muted-natural border-l border-border-natural">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-natural text-text-natural/80">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={headers.length + 2} className="p-8 text-center text-text-natural/50 font-medium">
                  {searchTerm ? 'No imported rows matched your search.' : 'Sheet is empty.'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={row.__id} className="hover:bg-white transition">
                  <td className="p-2 pl-4 text-center text-text-natural/40 font-mono text-[10px] w-10">
                    {idx + 1}
                  </td>
                  {headers.map((h, i) => (
                    <td key={i} className="p-2 whitespace-nowrap max-w-xs overflow-hidden text-ellipsis selection:bg-accent-natural selection:text-white">
                      {row[h] !== undefined && row[h] !== null ? String(row[h]) : ''}
                    </td>
                  ))}
                  <td className="p-2 text-center sticky right-0 bg-white shadow-[-8px_0_12px_rgba(62,54,46,0.03)] border-l border-border-natural">
                    <button
                      onClick={() => onDeleteRow(row.__id)}
                      className="text-[#A6998A] hover:text-rose-600 p-1 rounded hover:bg-rose-50/55 transition cursor-pointer"
                      title="Delete individual line item row"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
