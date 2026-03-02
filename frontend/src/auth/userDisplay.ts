export function formatCurrentUserDisplayName(
  sessionDisplayName: string | null | undefined,
  fallback: string
): string {
  const normalizedDisplayName = (sessionDisplayName ?? "").trim();

  if (!normalizedDisplayName) {
    return fallback;
  }

  const prefixedNameMatch = normalizedDisplayName.match(/^[A-Z]*\d+\s*[-:|]\s*(.+)$/i);
  if (prefixedNameMatch?.[1]) {
    const extractedName = prefixedNameMatch[1].trim();
    if (extractedName && /[A-Za-z]/.test(extractedName)) {
      return extractedName;
    }
  }

  const trailingIdMatch = normalizedDisplayName.match(/^(.+?)\s*\([A-Z]*\d+\)\s*$/i);
  if (trailingIdMatch?.[1]) {
    const extractedName = trailingIdMatch[1].trim();
    if (extractedName && /[A-Za-z]/.test(extractedName)) {
      return extractedName;
    }
  }

  const suffixedNameMatch = normalizedDisplayName.match(/^(.+?)\s*[-:|]\s*[A-Z]*\d+\s*$/i);
  if (suffixedNameMatch?.[1]) {
    const extractedName = suffixedNameMatch[1].trim();
    if (extractedName && /[A-Za-z]/.test(extractedName)) {
      return extractedName;
    }
  }

  if (normalizedDisplayName) {
    return normalizedDisplayName;
  }

  return fallback;
}
