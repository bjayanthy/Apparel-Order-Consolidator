/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExampleDataset } from '../types';

export const EXAMPLES: ExampleDataset[] = [
  {
    name: "Summer Boutique Drop (Customer Pre-orders)",
    description: "Various customer and retailer pre-orders with separate item rows, sizes, and colors that need consolidation into a single production/order list for clothing manufacturers.",
    headers: ["Retailer Name", "Style SKU", "Garment Name", "Colorway", "Size", "Order Qty", "Category"],
    rows: [
      { "Retailer Name": "Nordic Weave", "Style SKU": "LN-BTN-01", "Garment Name": "Linen Summer Button-Up", "Colorway": "Sage Green", "Size": "M", "Order Qty": 15, "Category": "Tops" },
      { "Retailer Name": "Indigo Studio", "Style SKU": "LN-BTN-01", "Garment Name": "Linen Summer Button-Up", "Colorway": "Sage Green", "Size": "M", "Order Qty": 12, "Category": "Tops" },
      { "Retailer Name": "Nordic Weave", "Style SKU": "LN-BTN-01", "Garment Name": "Linen Summer Button-Up", "Colorway": "Sage Green", "Size": "L", "Order Qty": 20, "Category": "Tops" },
      { "Retailer Name": "Lighthouse Co.", "Style SKU": "LN-BTN-01", "Garment Name": "Linen Summer Button-Up", "Colorway": "Oatmeal", "Size": "S", "Order Qty": 8, "Category": "Tops" },
      { "Retailer Name": "Nordic Weave", "Style SKU": "LN-BTN-01", "Garment Name": "Linen Summer Button-Up", "Colorway": "Oatmeal", "Size": "M", "Order Qty": 15, "Category": "Tops" },
      { "Retailer Name": "Indigo Studio", "Style SKU": "LN-BTN-01", "Garment Name": "Linen Summer Button-Up", "Colorway": "Oatmeal", "Size": "M", "Order Qty": 10, "Category": "Tops" },
      { "Retailer Name": "Lighthouse Co.", "Style SKU": "LN-BTN-01", "Garment Name": "Linen Summer Button-Up", "Colorway": "Oatmeal", "Size": "L", "Order Qty": 15, "Category": "Tops" },
      { "Retailer Name": "Minimalist Club", "Style SKU": "DN-JKT-08", "Garment Name": "Selvedge Denim Jacket", "Colorway": "Indigo Wash", "Size": "M", "Order Qty": 5, "Category": "Outerwear" },
      { "Retailer Name": "Lighthouse Co.", "Style SKU": "DN-JKT-08", "Garment Name": "Selvedge Denim Jacket", "Colorway": "Indigo Wash", "Size": "M", "Order Qty": 10, "Category": "Outerwear" },
      { "Retailer Name": "Indigo Studio", "Style SKU": "DN-JKT-08", "Garment Name": "Selvedge Denim Jacket", "Colorway": "Indigo Wash", "Size": "L", "Order Qty": 12, "Category": "Outerwear" },
      { "Retailer Name": "Nordic Weave", "Style SKU": "DN-JKT-08", "Garment Name": "Selvedge Denim Jacket", "Colorway": "Indigo Wash", "Size": "XL", "Order Qty": 6, "Category": "Outerwear" },
      { "Retailer Name": "Minimalist Club", "Style SKU": "DN-JKT-08", "Garment Name": "Selvedge Denim Jacket", "Colorway": "Raw Black", "Size": "S", "Order Qty": 4, "Category": "Outerwear" },
      { "Retailer Name": "Minimalist Club", "Style SKU": "DN-JKT-08", "Garment Name": "Selvedge Denim Jacket", "Colorway": "Raw Black", "Size": "M", "Order Qty": 8, "Category": "Outerwear" },
      { "Retailer Name": "Nordic Weave", "Style SKU": "DN-JKT-08", "Garment Name": "Selvedge Denim Jacket", "Colorway": "Raw Black", "Size": "M", "Order Qty": 12, "Category": "Outerwear" },
      { "Retailer Name": "Lighthouse Co.", "Style SKU": "OG-TEE-22", "Garment Name": "Heavyweight Slub Tee", "Colorway": "Vintage White", "Size": "S", "Order Qty": 25, "Category": "Basics" },
      { "Retailer Name": "Indigo Studio", "Style SKU": "OG-TEE-22", "Garment Name": "Heavyweight Slub Tee", "Colorway": "Vintage White", "Size": "S", "Order Qty": 30, "Category": "Basics" },
      { "Retailer Name": "Minimalist Club", "Style SKU": "OG-TEE-22", "Garment Name": "Heavyweight Slub Tee", "Colorway": "Vintage White", "Size": "M", "Order Qty": 40, "Category": "Basics" },
      { "Retailer Name": "Lighthouse Co.", "Style SKU": "OG-TEE-22", "Garment Name": "Heavyweight Slub Tee", "Colorway": "Vintage White", "Size": "M", "Order Qty": 35, "Category": "Basics" },
      { "Retailer Name": "Nordic Weave", "Style SKU": "OG-TEE-22", "Garment Name": "Heavyweight Slub Tee", "Colorway": "Vintage White", "Size": "L", "Order Qty": 40, "Category": "Basics" },
      { "Retailer Name": "Minimalist Club", "Style SKU": "OG-TEE-22", "Garment Name": "Heavyweight Slub Tee", "Colorway": "Vintage White", "Size": "L", "Order Qty": 25, "Category": "Basics" },
      { "Retailer Name": "Indigo Studio", "Style SKU": "OG-TEE-22", "Garment Name": "Heavyweight Slub Tee", "Colorway": "Coal Black", "Size": "M", "Order Qty": 50, "Category": "Basics" },
      { "Retailer Name": "Lighthouse Co.", "Style SKU": "OG-TEE-22", "Garment Name": "Heavyweight Slub Tee", "Colorway": "Coal Black", "Size": "L", "Order Qty": 45, "Category": "Basics" },
      { "Retailer Name": "Nordic Weave", "Style SKU": "CP-CAR-11", "Garment Name": "Ripstop Cargo Pant", "Colorway": "Dark Khaki", "Size": "32", "Order Qty": 15, "Category": "Pants" },
      { "Retailer Name": "Indigo Studio", "Style SKU": "CP-CAR-11", "Garment Name": "Ripstop Cargo Pant", "Colorway": "Dark Khaki", "Size": "32", "Order Qty": 10, "Category": "Pants" },
      { "Retailer Name": "Minimalist Club", "Style SKU": "CP-CAR-11", "Garment Name": "Ripstop Cargo Pant", "Colorway": "Dark Khaki", "Size": "34", "Order Qty": 20, "Category": "Pants" },
      { "Retailer Name": "Lighthouse Co.", "Style SKU": "CP-CAR-11", "Garment Name": "Ripstop Cargo Pant", "Colorway": "Dark Khaki", "Size": "34", "Order Qty": 15, "Category": "Pants" },
      { "Retailer Name": "Nordic Weave", "Style SKU": "CP-CAR-11", "Garment Name": "Ripstop Cargo Pant", "Colorway": "Olive", "Size": "32", "Order Qty": 18, "Category": "Pants" },
      { "Retailer Name": "Indigo Studio", "Style SKU": "CP-CAR-11", "Garment Name": "Ripstop Cargo Pant", "Colorway": "Olive", "Size": "34", "Order Qty": 22, "Category": "Pants" }
    ],
    defaultMapping: {
      itemName: "Garment Name",
      sku: "Style SKU",
      size: "Size",
      color: "Colorway",
      quantity: "Order Qty",
      category: "Category"
    }
  },
  {
    name: "Winter Outerwear Pre-Run (Multi-Vendor Orders)",
    description: "Cold-weather collection spreadsheet layout featuring custom insulated coats and heavy wool knits with complex size and color keys.",
    headers: ["Product Description", "Supplier Code", "Colourway Options", "Sizing Key", "Booking Qty", "Supplier Category"],
    rows: [
      { "Product Description": "Sherpa lined Field Coat", "Supplier Code": "FC-SH-88", "Colourway Options": "Desert Tan", "Sizing Key": "Standard - S", "Booking Qty": 12, "Supplier Category": "Coats" },
      { "Product Description": "Sherpa lined Field Coat", "Supplier Code": "FC-SH-88", "Colourway Options": "Desert Tan", "Sizing Key": "Standard - M", "Booking Qty": 24, "Supplier Category": "Coats" },
      { "Product Description": "Sherpa lined Field Coat", "Supplier Code": "FC-SH-88", "Colourway Options": "Desert Tan", "Sizing Key": "Standard - L", "Booking Qty": 30, "Supplier Category": "Coats" },
      { "Product Description": "Sherpa lined Field Coat", "Supplier Code": "FC-SH-88", "Colourway Options": "Desert Tan", "Sizing Key": "Standard - XL", "Booking Qty": 12, "Supplier Category": "Coats" },
      { "Product Description": "Sherpa lined Field Coat", "Supplier Code": "FC-SH-88", "Colourway Options": "Forest Green", "Sizing Key": "Standard - M", "Booking Qty": 15, "Supplier Category": "Coats" },
      { "Product Description": "Sherpa lined Field Coat", "Supplier Code": "FC-SH-88", "Colourway Options": "Forest Green", "Sizing Key": "Standard - L", "Booking Qty": 25, "Supplier Category": "Coats" },
      { "Product Description": "Cable-Knit Alpaca Sweater", "Supplier Code": "AK-CB-92", "Colourway Options": "Heather Oatmeal", "Sizing Key": "S", "Booking Qty": 10, "Supplier Category": "Knitwear" },
      { "Product Description": "Cable-Knit Alpaca Sweater", "Supplier Code": "AK-CB-92", "Colourway Options": "Heather Oatmeal", "Sizing Key": "M", "Booking Qty": 20, "Supplier Category": "Knitwear" },
      { "Product Description": "Cable-Knit Alpaca Sweater", "Supplier Code": "AK-CB-92", "Colourway Options": "Heather Oatmeal", "Sizing Key": "L", "Booking Qty": 20, "Supplier Category": "Knitwear" },
      { "Product Description": "Cable-Knit Alpaca Sweater", "Supplier Code": "AK-CB-92", "Colourway Options": "Navy Blue", "Sizing Key": "M", "Booking Qty": 15, "Supplier Category": "Knitwear" },
      { "Product Description": "Cable-Knit Alpaca Sweater", "Supplier Code": "AK-CB-92", "Colourway Options": "Navy Blue", "Sizing Key": "L", "Booking Qty": 15, "Supplier Category": "Knitwear" },
      { "Product Description": "Merino Ribbed Beanie", "Supplier Code": "BN-RI-05", "Colourway Options": "Mustard Yellow", "Sizing Key": "One Size", "Booking Qty": 50, "Supplier Category": "Accessories" },
      { "Product Description": "Merino Ribbed Beanie", "Supplier Code": "BN-RI-05", "Colourway Options": "Navy Blue", "Sizing Key": "One Size", "Booking Qty": 75, "Supplier Category": "Accessories" },
      { "Product Description": "Merino Ribbed Beanie", "Supplier Code": "BN-RI-05", "Colourway Options": "Mustard Yellow", "Sizing Key": "One Size", "Booking Qty": 35, "Supplier Category": "Accessories" }
    ],
    defaultMapping: {
      itemName: "Product Description",
      sku: "Supplier Code",
      size: "Sizing Key",
      color: "Colourway Options",
      quantity: "Booking Qty",
      category: "Supplier Category"
    }
  }
];
