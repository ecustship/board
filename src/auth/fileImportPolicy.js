export const POINT_TABLE_MAX_IMPORT_BYTES = 5 * 1024 * 1024;

const allowedExtensions = new Set([".csv", ".json", ".xls", ".xlsx"]);
const blockedExtensions = new Set([
  ".bat",
  ".cmd",
  ".com",
  ".dll",
  ".exe",
  ".hta",
  ".html",
  ".js",
  ".jse",
  ".msi",
  ".ps1",
  ".scr",
  ".svg",
  ".vbs",
  ".wsf",
]);

export const validatePointTableImportFile = (file) => {
  if (!file) return "请选择需要导入的文件";

  const name = String(file.name || "").trim();
  const lowerName = name.toLowerCase();
  const extension = lowerName.includes(".") ? lowerName.slice(lowerName.lastIndexOf(".")) : "";

  if (!allowedExtensions.has(extension) || blockedExtensions.has(extension)) {
    return "仅允许导入 CSV、JSON、XLS 或 XLSX 点表文件";
  }
  if (Number(file.size || 0) <= 0) {
    return "导入文件为空";
  }
  if (Number(file.size || 0) > POINT_TABLE_MAX_IMPORT_BYTES) {
    return "导入文件超过 5 MiB 限制";
  }

  return "";
};
