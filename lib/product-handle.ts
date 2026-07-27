export const SHOPIFY_HANDLE_MAX_LENGTH = 255;

export function isValidProductHandle(value: string) {
  if (!value || value.length > SHOPIFY_HANDLE_MAX_LENGTH) {
    return false;
  }

  let decodedValue: string;

  try {
    decodedValue = decodeURIComponent(value);
  } catch {
    return false;
  }

  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(decodedValue);
}
