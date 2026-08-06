#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";


async function loadArtifactTool() {
  try {
    return await import("@oai/artifact-tool");
  } catch {
    const fallback = path.join(
      os.homedir(),
      ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs",
    );
    return import(pathToFileURL(fallback).href);
  }
}

const { SpreadsheetFile, Workbook } = await loadArtifactTool();
const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sourceWorkbook = process.argv[2] ?? path.join(
  os.homedir(),
  "jiestar/定价参考/Shopify运费模板_体积重_Shopify盒规补全_缺失SKU补全_20260701.xlsx",
);
const iblockAuditWorkbook = process.argv[3] ?? path.join(
  repoRoot,
  "outputs/iblock-shipping-20260713/iBlock_Shopify重量与缺失SKU核对_20260713.xlsx",
);
const outputDir = process.argv[4] ?? path.join(
  repoRoot,
  "outputs/019fb5f3-8f25-7f02-9403-727aefd39ceb",
);
const overridePath = path.join(repoRoot, "scripts/data/shopify_shipping_weight_overrides_20260731.json");
const previewDir = path.join("/private/tmp", "jiestar-standard-air-sea-20260731-previews");
const dateSuffix = "20260731";

const AIR_OUTPUT = path.join(outputDir, `Shopify普货空运结算模板_${dateSuffix}.xlsx`);
const SEA_OUTPUT = path.join(outputDir, `Shopify普货海运结算模板_${dateSuffix}.xlsx`);
const WEIGHT_OUTPUT = path.join(outputDir, `Shopify商品计费重量主表_${dateSuffix}.xlsx`);

const FX_RATE = 6.8;
const SAFETY_RATE = 0.10;
const VARIABLE_RATE = 0.1099;
const VOLUMETRIC_DIVISOR = 5000;
const MAX_AUTO_WEIGHT_KG = 10;
const TIER_SIZE_KG = 0.5;
const STANDARD_PROFILE = "Standard goods";
const MANUAL_PROFILE = "Manual review";

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

function clean(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function numeric(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizedSku(value) {
  return clean(value).toUpperCase();
}

function rowsFromSheet(workbook, sheetName) {
  const sheet = workbook.worksheets.getItem(sheetName);
  const values = sheet.getUsedRange().values;
  const headers = values[0].map(clean);
  return values.slice(1)
    .filter((row) => row.some((value) => value !== null && value !== undefined && value !== ""))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
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
    wrapText: true,
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

function freightPriceUsd(rmb) {
  return Math.ceil((rmb / FX_RATE) * (1 + SAFETY_RATE) / (1 - VARIABLE_RATE) + 0.01) - 0.01;
}

function rateTier(row) {
  const max = numeric(row.maxWeightKg ?? row["Max Weight kg"]);
  return max === null ? null : max;
}

function normalizeRate(source, mode) {
  const max = numeric(source["Max Weight kg"]);
  const min = numeric(source["Min Weight kg"]);
  const rmb = numeric(source["Freight Cost RMB"]);
  if (max === null || min === null || rmb === null || rmb <= 0) {
    throw new Error(`Invalid ${mode} rate row: ${JSON.stringify(source)}`);
  }
  return {
    sourceProfile: mode === "Air" ? "Standard goods source" : "Legacy US/AU sea source",
    country: clean(source["Zone Country"]),
    countryCode: clean(source["Country Code"]).toUpperCase(),
    mode,
    serviceType: mode === "Air" ? "Standard goods air" : "Standard goods sea",
    rateName: mode === "Air" ? "Air Shipping" : "Sea Shipping",
    transitTime: clean(source["Transit Time"]),
    minWeightKg: min,
    maxWeightKg: max,
    freightCostRmb: rmb,
    priceUsd: freightPriceUsd(rmb),
    sourceRateName: mode === "Air"
      ? clean(source["Rate Name"]).replace("Standard goods", "Air")
      : `${clean(source["Country Code"]).toUpperCase()} Sea source ${max.toFixed(1)}kg`,
  };
}

function baseProductRow(row) {
  return {
    sourceWorkbook: clean(row["Source Workbook"]),
    brand: clean(row.Brand),
    sku: normalizedSku(row.SKU),
    title: clean(row["Shopify Title"]),
    name: clean(row.Name),
    series: clean(row.Series),
    actualUnitGrossKg: numeric(row["Actual Unit Weight kg"]),
    actualWeightSource: clean(row["Unit Weight Source"]),
    boxSizeRaw: clean(row["Box Size Raw"]),
    boxLengthCm: numeric(row["Box L cm"]),
    boxWidthCm: numeric(row["Box W cm"]),
    boxHeightCm: numeric(row["Box H cm"]),
    dimensionSource: clean(row["Box Size Source"]),
    sourceListingStatus: clean(row["Listing Status"]),
    batteryInternalNote: clean(row["Battery/Electric Risk"]) === "Yes" ? "Yes" : "No",
    notes: clean(row["Parser Notes"]),
  };
}

function calculateProduct(product) {
  const dimensionsReady = [product.boxLengthCm, product.boxWidthCm, product.boxHeightCm]
    .every((value) => value !== null && value > 0);
  const actualReady = product.actualUnitGrossKg !== null && product.actualUnitGrossKg > 0;
  const volumetricKg = dimensionsReady
    ? product.boxLengthCm * product.boxWidthCm * product.boxHeightCm / VOLUMETRIC_DIVISOR
    : null;
  const candidates = [actualReady ? product.actualUnitGrossKg : null, volumetricKg]
    .filter((value) => value !== null);
  const chargeableKg = candidates.length ? Math.max(...candidates) : null;
  const chargeableG = chargeableKg === null ? null : Math.ceil(chargeableKg * 1000);
  const weightTierKg = chargeableKg === null || chargeableKg > MAX_AUTO_WEIGHT_KG
    ? null
    : Math.max(TIER_SIZE_KG, Math.ceil(chargeableKg / TIER_SIZE_KG) * TIER_SIZE_KG);
  let importStatus = "No";
  let profile = "";
  let handling = "Draft if currently Active";
  let verification = "Missing reliable color-box dimensions";
  if (dimensionsReady && chargeableG !== null && chargeableG > 0) {
    if (chargeableKg > MAX_AUTO_WEIGHT_KG) {
      importStatus = "Review";
      profile = MANUAL_PROFILE;
      handling = "Keep Active; manual shipping review only";
      verification = "Verified color-box dimensions; no +2cm buffer; over 10kg";
    } else {
      importStatus = "Yes";
      profile = STANDARD_PROFILE;
      handling = "Eligible for standard air/sea profile";
      verification = "Verified color-box dimensions; no +2cm buffer";
    }
  }
  return {
    ...product,
    dimensionsReady,
    actualReady,
    volumetricKg,
    chargeableKg,
    chargeableG,
    weightTierKg,
    importStatus,
    profile,
    handling,
    verification,
  };
}

async function loadWorkbook(filePath) {
  const bytes = await fs.readFile(filePath);
  return SpreadsheetFile.importXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}

async function renderWorkbook(workbook, workbookLabel, sheetRanges) {
  const targetDir = path.join(previewDir, workbookLabel);
  await fs.mkdir(targetDir, { recursive: true });
  for (const [sheetName, range] of Object.entries(sheetRanges)) {
    const preview = await workbook.render({ sheetName, range, autoCrop: "all", scale: 0.8, format: "png" });
    await fs.writeFile(
      path.join(targetDir, `${sheetName.replaceAll(" ", "_")}.png`),
      new Uint8Array(await preview.arrayBuffer()),
    );
  }
}

async function assertNoFormulaErrors(workbook, label) {
  const result = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 100 },
    summary: `${label} formula error scan`,
  });
  if (result.ndjson.includes('"count":') && !result.ndjson.includes('"count":0')) {
    throw new Error(`${label} formula errors: ${result.ndjson}`);
  }
}

function addInputsSheet(workbook, mode, sourceCount) {
  const sheet = workbook.worksheets.add("Inputs");
  const rows = [
    ["Template Type", mode],
    ["Source Active Rate Rows", sourceCount],
    ["USD/CNY Exchange Rate", FX_RATE],
    ["Shipping Safety Factor", SAFETY_RATE],
    ["Combined Variable Rate", VARIABLE_RATE],
    ["Volumetric Divisor", VOLUMETRIC_DIVISOR],
    ["Dimension Buffer cm", 0],
    ["Maximum Automatic Weight kg", MAX_AUTO_WEIGHT_KG],
    ["Customer-facing Rate Name", mode === "Air" ? "Air Shipping" : "Sea Shipping"],
    ["Price Formula", "ROUNDUP((RMB/6.8)×(1+10%)/(1-10.99%)+0.01,0)-0.01"],
  ];
  writeTable(sheet, ["Parameter", "Value"], rows, `${mode}Inputs`, [34, 62]);
  sheet.getRange("B5:B6").format.numberFormat = "0.00%";
  sheet.getRange("A12:B14").merge();
  sheet.getRange("A12").values = [[
    "This workbook contains standard-goods rates only. Battery/electric rates are intentionally excluded and must not be imported into Shopify.",
  ]];
  sheet.getRange("A12:B14").format = {
    fill: colors.lightAmber,
    font: { color: colors.amber, bold: true },
    wrapText: true,
    verticalAlignment: "center",
  };
}

function buildRateWorkbook(rates, mode) {
  const workbook = Workbook.create();
  addInputsSheet(workbook, mode, rates.length);
  const sourceSheet = workbook.worksheets.add("Rate_Source");
  const sourceHeaders = [
    "Source Profile", "Country", "Country Code", "Mode", "Source Rate Name", "Transit Time",
    "Min Weight kg", "Max Weight kg", "Freight Cost RMB", "Calculated Price USD", "Source Status",
  ];
  const sourceRows = rates.map((rate) => [
    rate.sourceProfile, rate.country, rate.countryCode, rate.mode, rate.sourceRateName, rate.transitTime,
    rate.minWeightKg, rate.maxWeightKg, rate.freightCostRmb, null, "Included",
  ]);
  const sourceEnd = writeTable(
    sourceSheet,
    sourceHeaders,
    sourceRows,
    `${mode}RateSource`,
    [26, 22, 14, 14, 34, 20, 16, 16, 18, 20, 16],
  );
  if (rates.length) {
    const formulas = [];
    for (let row = 2; row <= sourceEnd; row += 1) {
      formulas.push([`=ROUNDUP((I${row}/Inputs!$B$4)*(1+Inputs!$B$5)/(1-Inputs!$B$6)+0.01,0)-0.01`]);
    }
    sourceSheet.getRange(`J2:J${sourceEnd}`).formulas = formulas;
    sourceSheet.getRange(`G2:J${sourceEnd}`).format.numberFormat = "0.00";
  }

  const shopifySheet = workbook.worksheets.add("Shopify_Rates");
  const shopifyHeaders = [
    "Shipping Profile", "Zone Country", "Country Code", "Service Type", "Rate Name", "Transit Time",
    "Min Weight kg", "Max Weight kg", "Price USD", "Freight Cost RMB", "Active", "Notes",
  ];
  const shopifyRows = rates.map((rate) => [
    STANDARD_PROFILE,
    rate.country,
    rate.countryCode,
    rate.serviceType,
    rate.rateName,
    rate.transitTime,
    rate.minWeightKg,
    rate.maxWeightKg,
    rate.priceUsd,
    rate.freightCostRmb,
    "Active",
    "Standard-goods rate; customer sees only the friendly shipping method name.",
  ]);
  const shopifyEnd = writeTable(
    shopifySheet,
    shopifyHeaders,
    shopifyRows,
    `${mode}ShopifyRates`,
    [24, 22, 14, 24, 22, 20, 16, 16, 14, 18, 12, 56],
  );
  if (shopifyRows.length) shopifySheet.getRange(`G2:J${shopifyEnd}`).format.numberFormat = "0.00";

  const qaSheet = workbook.worksheets.add("QA");
  const expected = mode === "Air" ? 240 : 31;
  const expectedCountries = mode === "Air" ? 12 : 2;
  const qaRows = [
    ["Expected rate rows", expected, rates.length, rates.length === expected ? "PASS" : "FAIL"],
    ["Expected country count", expectedCountries, new Set(rates.map((rate) => rate.countryCode)).size, new Set(rates.map((rate) => rate.countryCode)).size === expectedCountries ? "PASS" : "FAIL"],
    ["Battery/electric source rows included", 0, rates.filter((rate) => rate.sourceProfile.toLowerCase().includes("battery")).length, rates.every((rate) => !rate.sourceProfile.toLowerCase().includes("battery")) ? "PASS" : "FAIL"],
    ["Friendly rate names only", 1, new Set(rates.map((rate) => rate.rateName)).size, new Set(rates.map((rate) => rate.rateName)).size === 1 ? "PASS" : "FAIL"],
    ["Maximum rate tier kg", 10, Math.max(...rates.map((rate) => rate.maxWeightKg)), Math.max(...rates.map((rate) => rate.maxWeightKg)) === 10 ? "PASS" : "FAIL"],
  ];
  if (mode === "Sea") {
    qaRows.push(
      ["United States sea tiers", 20, rates.filter((rate) => rate.countryCode === "US").length, rates.filter((rate) => rate.countryCode === "US").length === 20 ? "PASS" : "FAIL"],
      ["Australia sea tiers", 11, rates.filter((rate) => rate.countryCode === "AU").length, rates.filter((rate) => rate.countryCode === "AU").length === 11 ? "PASS" : "FAIL"],
    );
  }
  writeTable(qaSheet, ["Check", "Expected", "Actual", "Result"], qaRows, `${mode}QA`, [42, 18, 18, 16]);
  qaSheet.getRange(`D2:D${qaRows.length + 1}`).conditionalFormats.add(
    "containsText",
    { text: "PASS", format: { fill: colors.lightGreen, font: { color: colors.green, bold: true } } },
  );
  qaSheet.getRange(`D2:D${qaRows.length + 1}`).conditionalFormats.add(
    "containsText",
    { text: "FAIL", format: { fill: colors.lightRed, font: { color: colors.red, bold: true } } },
  );
  return workbook;
}

function buildWeightWorkbook(products) {
  const workbook = Workbook.create();
  const inputs = workbook.worksheets.add("Inputs");
  const counts = Object.fromEntries(
    ["Yes", "Review", "No"].map((status) => [status, products.filter((product) => product.importStatus === status).length]),
  );
  writeTable(
    inputs,
    ["Parameter", "Value"],
    [
      ["Volumetric divisor", VOLUMETRIC_DIVISOR],
      ["Dimension buffer cm", 0],
      ["Maximum automatic weight kg", MAX_AUTO_WEIGHT_KG],
      ["Weight tier kg", TIER_SIZE_KG],
      ["Eligible source SKU count", counts.Yes],
      ["Manual heavy source SKU count", counts.Review],
      ["Source SKU requiring Draft if Active", counts.No],
      ["Actual weight rule", "Unit gross first; otherwise carton gross ÷ carton quantity"],
      ["Volumetric rule", "Color-box L × W × H ÷ 5000; no +2cm"],
      ["Shopify weight rule", "CEILING(MAX(actual unit gross, volumetric) × 1000) grams"],
      ["Net weight", "Never used for shipping actual weight"],
      ["Battery/electric field", "Internal reference only; never changes rates or profile"],
    ],
    "WeightInputs",
    [42, 76],
  );

  const productSheet = workbook.worksheets.add("Product_Chargeable_Weight");
  const headers = [
    "Source Workbook", "Brand", "SKU", "Shopify Title", "Name", "Series",
    "Actual Unit Gross kg", "Actual Weight Source", "Box Size Raw", "Box L cm", "Box W cm", "Box H cm",
    "Volumetric Weight kg", "Chargeable Weight kg", "Shopify Weight g", "Weight Tier kg",
    "Dimension Ready", "Actual Weight Ready", "Weight Import Status", "Shipping Profile Suggestion",
    "Live Handling Rule", "Source Listing Status", "Battery/Electric Internal Note", "Dimension Verification",
    "Dimension Source", "Notes",
  ];
  const rows = products.map((product) => [
    product.sourceWorkbook,
    product.brand,
    product.sku,
    product.title,
    product.name,
    product.series,
    product.actualUnitGrossKg,
    product.actualWeightSource,
    product.boxSizeRaw,
    product.boxLengthCm,
    product.boxWidthCm,
    product.boxHeightCm,
    product.volumetricKg,
    product.chargeableKg,
    product.chargeableG,
    product.weightTierKg,
    product.dimensionsReady ? "Yes" : "No",
    product.actualReady ? "Yes" : "No",
    product.importStatus,
    product.profile,
    product.handling,
    product.sourceListingStatus,
    product.batteryInternalNote,
    product.verification,
    product.dimensionSource,
    product.notes,
  ]);
  const productEnd = writeTable(
    productSheet,
    headers,
    rows,
    "ProductChargeableWeight",
    [46, 16, 18, 44, 28, 22, 20, 34, 26, 12, 12, 12, 22, 22, 20, 16, 16, 18, 20, 30, 40, 24, 24, 42, 38, 56],
  );
  if (products.length) {
    productSheet.getRange(`G2:P${productEnd}`).format.numberFormat = "0.000";
    productSheet.getRange(`S2:S${productEnd}`).conditionalFormats.add(
      "containsText",
      { text: "Yes", format: { fill: colors.lightGreen, font: { color: colors.green, bold: true } } },
    );
    productSheet.getRange(`S2:S${productEnd}`).conditionalFormats.add(
      "containsText",
      { text: "Review", format: { fill: colors.lightAmber, font: { color: colors.amber, bold: true } } },
    );
    productSheet.getRange(`S2:S${productEnd}`).conditionalFormats.add(
      "containsText",
      { text: "No", format: { fill: colors.lightRed, font: { color: colors.red, bold: true } } },
    );
  }

  const importSheet = workbook.worksheets.add("Shopify商品重量导入");
  const importHeaders = [
    "Handle", "Title", "Variant SKU", "Variant Weight", "Variant Weight Unit", "Requires Shipping",
    "Vendor", "Tags", "Shipping Profile Suggestion", "Weight Import Status", "Dimension Verification",
    "Shipping Status", "Listing Status", "Notes",
  ];
  const importRows = products.map((product) => [
    product.sku.toLowerCase(),
    product.title || `${product.brand} ${product.sku} Building Block Set`,
    product.sku,
    product.chargeableG,
    "g",
    true,
    product.brand,
    `${product.brand},building blocks`,
    product.profile,
    product.importStatus,
    product.verification,
    product.handling,
    product.sourceListingStatus,
    `${product.actualWeightSource || "No actual gross source"}; ${product.dimensionSource || "No reliable color-box dimensions"}`,
  ]);
  const importEnd = writeTable(
    importSheet,
    importHeaders,
    importRows,
    "ShopifyWeightImport",
    [20, 44, 18, 18, 16, 18, 18, 30, 30, 22, 44, 42, 24, 70],
  );
  if (importRows.length) importSheet.getRange(`D2:D${importEnd}`).format.numberFormat = "0";

  const backlogSheet = workbook.worksheets.add("Source_Review_Backlog");
  const backlog = products.filter((product) => product.importStatus === "No");
  writeTable(
    backlogSheet,
    ["SKU", "Brand", "Title", "Current Source Status", "Missing Evidence", "Required Action"],
    backlog.map((product) => [
      product.sku,
      product.brand,
      product.title,
      product.sourceListingStatus,
      product.verification,
      "If Shopify is Active, change the whole product to Draft; do not write a guessed weight.",
    ]),
    "SourceReviewBacklog",
    [18, 18, 46, 24, 44, 64],
  );

  const heavySheet = workbook.worksheets.add("Manual_Heavy");
  const heavy = products.filter((product) => product.importStatus === "Review");
  writeTable(
    heavySheet,
    ["SKU", "Brand", "Title", "Shopify Weight g", "Chargeable kg", "Handling"],
    heavy.map((product) => [
      product.sku,
      product.brand,
      product.title,
      product.chargeableG,
      product.chargeableKg,
      "Keep Active only in JIESTAR Manual Shipping Review; zero automatic rates.",
    ]),
    "ManualHeavy",
    [18, 18, 46, 20, 20, 62],
  );

  const qaSheet = workbook.worksheets.add("QA");
  const x88058 = products.find((product) => product.sku === "X88058");
  const duplicates = products.length - new Set(products.map((product) => product.sku)).size;
  const qaRows = [
    ["Duplicate SKU rows", 0, duplicates, duplicates === 0 ? "PASS" : "FAIL"],
    ["Dimension buffer cm", 0, 0, "PASS"],
    ["Battery-dependent profiles", 0, products.filter((product) => product.profile === "Battery/electric goods").length, products.every((product) => product.profile !== "Battery/electric goods") ? "PASS" : "FAIL"],
    ["X88058 volumetric kg", 1.0575, x88058?.volumetricKg ?? "", Math.abs((x88058?.volumetricKg ?? 0) - 1.0575) < 0.000001 ? "PASS" : "FAIL"],
    ["X88058 Shopify weight g", 1058, x88058?.chargeableG ?? "", x88058?.chargeableG === 1058 ? "PASS" : "FAIL"],
    ["X88058 tier kg", 1.5, x88058?.weightTierKg ?? "", x88058?.weightTierKg === 1.5 ? "PASS" : "FAIL"],
    ["Eligible source rows have positive weight", counts.Yes, products.filter((product) => product.importStatus === "Yes" && product.chargeableG > 0).length, products.filter((product) => product.importStatus === "Yes" && product.chargeableG > 0).length === counts.Yes ? "PASS" : "FAIL"],
    ["Eligible source rows have verified dimensions", counts.Yes, products.filter((product) => product.importStatus === "Yes" && product.dimensionsReady).length, products.filter((product) => product.importStatus === "Yes" && product.dimensionsReady).length === counts.Yes ? "PASS" : "FAIL"],
  ];
  writeTable(qaSheet, ["Check", "Expected", "Actual", "Result"], qaRows, "WeightQA", [48, 18, 18, 16]);
  qaSheet.getRange(`D2:D${qaRows.length + 1}`).conditionalFormats.add(
    "containsText",
    { text: "PASS", format: { fill: colors.lightGreen, font: { color: colors.green, bold: true } } },
  );
  qaSheet.getRange(`D2:D${qaRows.length + 1}`).conditionalFormats.add(
    "containsText",
    { text: "FAIL", format: { fill: colors.lightRed, font: { color: colors.red, bold: true } } },
  );
  return workbook;
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const source = await loadWorkbook(sourceWorkbook);
const sourceRateRows = rowsFromSheet(source, "Shopify运费配置");
const standardAirRates = sourceRateRows
  .filter((row) => clean(row.Active).toLowerCase() === "active")
  .filter((row) => clean(row["Shipping Profile"]) === "Standard goods")
  .filter((row) => clean(row["Service Type"]) === "Standard goods")
  .map((row) => normalizeRate(row, "Air"))
  .sort((a, b) => a.countryCode.localeCompare(b.countryCode) || rateTier(a) - rateTier(b));
const standardSeaRates = sourceRateRows
  .filter((row) => clean(row.Active).toLowerCase() === "active")
  .filter((row) => clean(row["Service Type"]) === "Sea battery-capable")
  .map((row) => normalizeRate(row, "Sea"))
  .sort((a, b) => a.countryCode.localeCompare(b.countryCode) || rateTier(a) - rateTier(b));

if (standardAirRates.length !== 240) throw new Error(`Expected 240 air rates, found ${standardAirRates.length}`);
if (standardSeaRates.length !== 31) throw new Error(`Expected 31 sea rates, found ${standardSeaRates.length}`);

const sourceProducts = rowsFromSheet(source, "Product_Chargeable_Weight");
const productMap = new Map(
  sourceProducts
    .map(baseProductRow)
    .filter((product) => product.sku)
    .map((product) => [product.sku, product]),
);

if (await fs.stat(iblockAuditWorkbook).catch(() => null)) {
  const iblock = await loadWorkbook(iblockAuditWorkbook);
  for (const row of rowsFromSheet(iblock, "Weight Updates")) {
    const sku = normalizedSku(row.SKU);
    const current = productMap.get(sku) ?? {
      sourceWorkbook: iblockAuditWorkbook,
      brand: "iBLOCK",
      sku,
      title: `iBlock ${sku} ${clean(row.Name)}`,
      name: clean(row.Name),
      series: clean(row.Series),
      sourceListingStatus: "Source catalog candidate",
      batteryInternalNote: "No",
      notes: "",
    };
    productMap.set(sku, {
      ...current,
      actualUnitGrossKg: numeric(row["Actual g"]) === null ? null : numeric(row["Actual g"]) / 1000,
      actualWeightSource: "Reviewed iBlock source unit/carton gross result",
      boxSizeRaw: clean(row["Box Size Raw"]),
      boxLengthCm: numeric(row["L cm"]),
      boxWidthCm: numeric(row["W cm"]),
      boxHeightCm: numeric(row["H cm"]),
      dimensionSource: "iBlock 2026-07 source workbook",
      notes: "Recalculated without the former +2cm dimension buffer.",
    });
  }
}

const overrides = JSON.parse(await fs.readFile(overridePath, "utf8"));
for (const override of overrides) {
  const sku = normalizedSku(override.sku);
  const current = productMap.get(sku) ?? {
    batteryInternalNote: "No",
  };
  productMap.set(sku, {
    ...current,
    ...override,
    sku,
    batteryInternalNote: current.batteryInternalNote ?? "No",
  });
}

const products = [...productMap.values()]
  .map(calculateProduct)
  .sort((a, b) => a.brand.localeCompare(b.brand, "zh-CN") || a.sku.localeCompare(b.sku));

const airWorkbook = buildRateWorkbook(standardAirRates, "Air");
const seaWorkbook = buildRateWorkbook(standardSeaRates, "Sea");
const weightWorkbook = buildWeightWorkbook(products);

await assertNoFormulaErrors(airWorkbook, "Air");
await assertNoFormulaErrors(seaWorkbook, "Sea");
await assertNoFormulaErrors(weightWorkbook, "Weight");

await renderWorkbook(airWorkbook, "air", {
  Inputs: "A1:B14",
  Rate_Source: "A1:K25",
  Shopify_Rates: "A1:L25",
  QA: "A1:D6",
});
await renderWorkbook(seaWorkbook, "sea", {
  Inputs: "A1:B14",
  Rate_Source: "A1:K25",
  Shopify_Rates: "A1:L25",
  QA: "A1:D8",
});
await renderWorkbook(
  weightWorkbook,
  "weight",
  {
    Inputs: "A1:B13",
    Product_Chargeable_Weight: "A1:Z24",
    Shopify商品重量导入: "A1:N24",
    Source_Review_Backlog: "A1:F24",
    Manual_Heavy: "A1:F12",
    QA: "A1:D9",
  },
);

const airFile = await SpreadsheetFile.exportXlsx(airWorkbook);
await airFile.save(AIR_OUTPUT);
const seaFile = await SpreadsheetFile.exportXlsx(seaWorkbook);
await seaFile.save(SEA_OUTPUT);
const weightFile = await SpreadsheetFile.exportXlsx(weightWorkbook);
await weightFile.save(WEIGHT_OUTPUT);

console.log(JSON.stringify({
  sourceWorkbook,
  iblockAuditWorkbook,
  outputs: { air: AIR_OUTPUT, sea: SEA_OUTPUT, weight: WEIGHT_OUTPUT },
  previewDir,
  counts: {
    airRates: standardAirRates.length,
    seaRates: standardSeaRates.length,
    weightRows: products.length,
    eligibleWeights: products.filter((product) => product.importStatus === "Yes").length,
    manualHeavy: products.filter((product) => product.importStatus === "Review").length,
    sourceReview: products.filter((product) => product.importStatus === "No").length,
  },
  x88058: products.find((product) => product.sku === "X88058"),
}, null, 2));
