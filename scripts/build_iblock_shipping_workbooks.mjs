#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";


const auditJsonPath = process.argv[2] ?? "/private/tmp/jiestar-shopify-iblock-shipping/iblock-shipping-audit.json";
const outputDir = process.argv[3] ?? "/Users/chensen/projects/jiestar-global-website/outputs/iblock-shipping-20260713";
const previewDir = "/private/tmp/jiestar-shopify-iblock-shipping/previews";
const auditOutput = path.join(outputDir, "iBlock_Shopify重量与缺失SKU核对_20260713.xlsx");
const templateOutput = path.join(outputDir, "Shopify运费模板_iBlock重量更新_20260713.xlsx");
const audit = JSON.parse(await fs.readFile(auditJsonPath, "utf8"));

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const colors = {
  ink: "#172033",
  navy: "#17324D",
  blue: "#2563EB",
  lightBlue: "#EAF2FF",
  green: "#15803D",
  lightGreen: "#EAF7EE",
  amber: "#B45309",
  lightAmber: "#FFF7E6",
  red: "#B42318",
  lightRed: "#FDECEC",
  gray: "#667085",
  lightGray: "#F3F5F7",
  border: "#D6DCE5",
  white: "#FFFFFF",
};

function colName(number) {
  let value = number;
  let output = "";
  while (value > 0) {
    value -= 1;
    output = String.fromCharCode(65 + (value % 26)) + output;
    value = Math.floor(value / 26);
  }
  return output;
}

function styleSheet(sheet) {
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
}

function writeTable(sheet, headers, rows, tableName, widths = []) {
  const endColumn = colName(headers.length);
  const endRow = rows.length + 1;
  sheet.getRange(`A1:${endColumn}${endRow}`).values = [headers, ...rows];
  sheet.getRange(`A1:${endColumn}1`).format = {
    fill: colors.navy,
    font: { bold: true, color: colors.white },
    rowHeight: 28,
    verticalAlignment: "center",
  };
  if (rows.length) {
    sheet.getRange(`A2:${endColumn}${endRow}`).format = {
      font: { color: colors.ink },
      borders: { preset: "inside", style: "thin", color: colors.border },
      verticalAlignment: "center",
    };
    sheet.tables.add(`A1:${endColumn}${endRow}`, true, tableName).style = "TableStyleMedium2";
  }
  widths.forEach((width, index) => {
    if (width) sheet.getRange(`${colName(index + 1)}:${colName(index + 1)}`).format.columnWidth = width;
  });
  styleSheet(sheet);
  return endRow;
}

function value(row, key, fallback = "") {
  const result = row?.[key];
  return result === null || result === undefined ? fallback : result;
}

const workbook = Workbook.create();
const summarySheet = workbook.worksheets.add("Summary");
const weightSheet = workbook.worksheets.add("Weight Updates");
const missingSheet = workbook.worksheets.add("Missing in Shopify");
const extraSheet = workbook.worksheets.add("Extra in Shopify");
const manualSheet = workbook.worksheets.add("Manual Review");

summarySheet.showGridLines = false;
summarySheet.getRange("A1:H2").merge();
summarySheet.getRange("A1").values = [["iBlock Shopify 重量与缺失 SKU 核对"]];
summarySheet.getRange("A1:H2").format = {
  fill: colors.navy,
  font: { bold: true, color: colors.white, size: 18 },
  verticalAlignment: "center",
};
summarySheet.getRange("A4:B14").values = [
  ["指标", "结果"],
  ["源表 SKU", audit.summary.source_sku_count],
  ["可更新源 SKU", audit.summary.eligible_source_sku_count],
  ["Shopify 快照", audit.summary.shopify_snapshot_ok ? "已取得" : "未取得"],
  ["Shopify 变体", audit.summary.shopify_variant_count],
  ["待更新重量", audit.summary.weight_update_count],
  ["重量已一致", audit.summary.weight_noop_count],
  ["Shopify 缺失", audit.summary.missing_in_shopify_count ?? "待快照确认"],
  ["缺失候选", audit.summary.candidate_missing_count],
  ["Shopify 额外", audit.summary.extra_in_shopify_count],
  ["人工复核", audit.summary.manual_review_count],
];
summarySheet.getRange("A4:B4").format = { fill: colors.blue, font: { bold: true, color: colors.white } };
summarySheet.getRange("A5:B14").format = { borders: { preset: "inside", style: "thin", color: colors.border } };
summarySheet.getRange("D4:H4").merge();
summarySheet.getRange("D4").values = [["执行边界"]];
summarySheet.getRange("D4:H4").format = { fill: colors.blue, font: { bold: true, color: colors.white } };
summarySheet.getRange("D5:H10").merge();
summarySheet.getRange("D5").values = [[
  "只更新 Shopify 中 vendor=iBlock 且 Active、SKU 精确匹配的变体。计费重量=max(单盒毛重, 彩盒长×彩盒宽×彩盒高÷5000)，不再增加2cm。不改价格、标题、SKU、图片、库存、商品状态或现有运费价格表。IB1101获奖版保持人工复核。",
]];
summarySheet.getRange("D5:H10").format = { fill: colors.lightBlue, font: { color: colors.ink }, wrapText: true, verticalAlignment: "top" };
summarySheet.getRange("D12:H12").merge();
summarySheet.getRange("D12").values = [["Shopify 快照状态"]];
summarySheet.getRange("D12:H12").format = { fill: audit.summary.shopify_snapshot_ok ? colors.green : colors.amber, font: { bold: true, color: colors.white } };
summarySheet.getRange("D13:H15").merge();
summarySheet.getRange("D13").values = [[audit.summary.shopify_snapshot_ok ? "当前 Shopify 数据已纳入核对。" : `当前 Admin API 未能读取：${audit.summary.shopify_snapshot_error || "未请求 Shopify"}。Missing 表中的行仅为候选，不能视为已确认缺失。`]];
summarySheet.getRange("D13:H15").format = { fill: audit.summary.shopify_snapshot_ok ? colors.lightGreen : colors.lightAmber, wrapText: true, verticalAlignment: "top" };
summarySheet.getRange("A:A").format.columnWidth = 24;
summarySheet.getRange("B:B").format.columnWidth = 18;
summarySheet.getRange("C:C").format.columnWidth = 3;
summarySheet.getRange("D:H").format.columnWidth = 16;
summarySheet.getRange("A17:H19").merge();
summarySheet.getRange("A17").values = [[`数据源：${audit.sources.source_workbook}\n基础运费模板：${audit.sources.base_template}`]];
summarySheet.getRange("A17:H19").format = { fill: colors.lightGray, font: { color: colors.gray, size: 9 }, wrapText: true, verticalAlignment: "top" };

const eligibleRows = audit.source_products.filter((row) => row.disposition === "eligible_if_active");
const shopifyBySku = new Map(audit.shopify_variants.map((row) => [String(row.sku).toUpperCase(), row]));
const weightHeaders = ["SKU", "Series", "Name", "Box Size Raw", "L cm", "W cm", "H cm", "Actual g", "Volumetric g", "Target g", "Old Template g", "Delta g", "Shopify Status", "Current Shopify g", "Action"];
const weightRows = eligibleRows.map((row) => {
  const shopify = shopifyBySku.get(String(row.sku).toUpperCase()) ?? {};
  const action = shopify.status === "ACTIVE"
    ? ((shopify.current_weight_g === row.target_weight_g && shopify.requires_shipping === true) ? "noop" : "update")
    : (shopify.status ? "not_active" : "missing_or_unconfirmed");
  return [row.sku, row.series, row.name, row.box_size_raw, row.box_length_cm, row.box_width_cm, row.box_height_cm, row.actual_weight_g, null, null, row.old_template_weight_g, row.delta_from_old_template_g, value(shopify, "status"), value(shopify, "current_weight_g"), action];
});
const weightEnd = writeTable(weightSheet, weightHeaders, weightRows, "IblockWeightUpdates", [16, 24, 32, 28, 10, 10, 10, 12, 14, 12, 16, 12, 16, 18, 24]);
if (weightRows.length) {
  const formulasI = [];
  const formulasJ = [];
  for (let row = 2; row <= weightEnd; row += 1) {
    formulasI.push([`=E${row}*F${row}*G${row}/5000*1000`]);
    formulasJ.push([`=ROUNDUP(MAX(H${row},I${row}),0)`]);
  }
  weightSheet.getRange(`I2:I${weightEnd}`).formulas = formulasI;
  weightSheet.getRange(`J2:J${weightEnd}`).formulas = formulasJ;
  weightSheet.getRange(`E2:L${weightEnd}`).format.numberFormat = "0.0";
  weightSheet.getRange(`O2:O${weightEnd}`).conditionalFormats.add("containsText", { text: "update", format: { fill: colors.lightAmber, font: { color: colors.amber, bold: true } } });
  weightSheet.getRange(`O2:O${weightEnd}`).conditionalFormats.add("containsText", { text: "noop", format: { fill: colors.lightGreen, font: { color: colors.green, bold: true } } });
}

const missingHeaders = ["SKU", "Series", "Name", "Target g", "Reason"];
writeTable(missingSheet, missingHeaders, audit.missing_in_shopify.map((row) => [row.sku, row.series, row.name, row.target_weight_g, row.reason]), "IblockMissing", [18, 28, 36, 14, 36]);
const extraHeaders = ["SKU", "Product", "Variant", "Status", "Current g", "Reason"];
writeTable(extraSheet, extraHeaders, audit.extra_in_shopify.map((row) => [row.sku, row.product_title, row.variant_title, row.status, row.current_weight_g, row.reason]), "IblockExtra", [18, 40, 28, 14, 14, 34]);
const manualHeaders = ["SKU", "Series / Product", "Name / Variant", "Target g", "Reason"];
writeTable(manualSheet, manualHeaders, audit.manual_review.map((row) => [row.sku, row.series ?? row.product_title ?? "", row.name ?? row.variant_title ?? "", row.target_weight_g ?? "", row.reason]), "IblockManual", [20, 34, 40, 14, 34]);

const formulaErrors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "iBlock audit workbook formula error scan",
});
if (formulaErrors.ndjson.includes('"count":') && !formulaErrors.ndjson.includes('"count":0')) {
  throw new Error(`Formula errors detected: ${formulaErrors.ndjson}`);
}

for (const sheetName of ["Summary", "Weight Updates", "Missing in Shopify", "Extra in Shopify", "Manual Review"]) {
  const preview = await workbook.render({ sheetName, range: sheetName === "Summary" ? "A1:H19" : undefined, autoCrop: "all", scale: 0.8, format: "png" });
  await fs.writeFile(path.join(previewDir, `${sheetName.replaceAll(" ", "_")}.png`), new Uint8Array(await preview.arrayBuffer()));
}
const auditFile = await SpreadsheetFile.exportXlsx(workbook);
await auditFile.save(auditOutput);

const templateWorkbook = Workbook.create();
const rateSheet = templateWorkbook.worksheets.add("Shopify运费配置");
const importSheet = templateWorkbook.worksheets.add("Shopify商品重量导入");
const rateHeaders = ["Shipping Profile", "Zone Country", "Country Code", "Service Type", "Rate Name", "Transit Time", "Min Weight kg", "Max Weight kg", "Price USD", "Freight Cost RMB", "Active", "Notes"];
writeTable(rateSheet, rateHeaders, [], "UnusedRatePlan", [28, 22, 14, 24, 34, 20, 16, 16, 14, 18, 12, 48]);
rateSheet.getRange("A3:L5").merge();
rateSheet.getRange("A3").values = [["本模板配合 --vendor iBlock --skip-rate-sync 使用；不会同步或覆盖现有国家运费费率。"]];
rateSheet.getRange("A3:L5").format = { fill: colors.lightAmber, font: { color: colors.amber, bold: true }, wrapText: true, verticalAlignment: "center" };

const importHeaders = ["Handle", "Title", "Variant SKU", "Variant Weight", "Variant Weight Unit", "Requires Shipping", "Vendor", "Tags", "Shipping Profile Suggestion", "Weight Import Status", "Dimension Verification", "Shipping Status", "Listing Status", "Notes"];
const importRows = eligibleRows.map((row) => [
  "", `iBlock ${row.sku} ${row.name}`, row.sku, row.target_weight_g, "g", true, "iBlock", `iBlock,${row.series},building blocks`, row.shipping_profile, "Yes", "Verified by 2026-07 source box size; no +2cm buffer", "Chargeable weight=max(actual gross, volumetric)", "Source eligible", `Source actual=${row.actual_weight_g}g; box=${row.box_size_raw}`,
]);
writeTable(importSheet, importHeaders, importRows, "IblockWeightImport", [14, 42, 18, 16, 14, 16, 14, 34, 28, 20, 36, 34, 18, 58]);
if (importRows.length) importSheet.getRange(`D2:D${importRows.length + 1}`).format.numberFormat = "0";

for (const sheetName of ["Shopify运费配置", "Shopify商品重量导入"]) {
  const preview = await templateWorkbook.render({ sheetName, autoCrop: "all", scale: 0.8, format: "png" });
  await fs.writeFile(path.join(previewDir, `template_${sheetName}.png`), new Uint8Array(await preview.arrayBuffer()));
}
const templateFile = await SpreadsheetFile.exportXlsx(templateWorkbook);
await templateFile.save(templateOutput);

console.log(JSON.stringify({ auditOutput, templateOutput, previewDir, eligibleCount: eligibleRows.length }, null, 2));
