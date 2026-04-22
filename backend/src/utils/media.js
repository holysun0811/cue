export function decodeBase64Payload(value = '') {
  if (!value) return null;
  const base64 = value.includes(',') ? value.split(',').pop() : value;
  return Buffer.from(base64, 'base64');
}

export function estimateDurationSecFromBase64(value = '') {
  if (!value) return 0;
  const bytes = decodeBase64Payload(value)?.byteLength || 0;
  return Math.max(8, Math.min(120, Math.round(bytes / 32000)));
}
