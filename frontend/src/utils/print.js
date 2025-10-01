export function safePrint(v){
  if (v == null) return '';
  // BSON Long de Mongo (driver v6): { low, high, unsigned }
  if (typeof v === 'object' && ('low' in v || 'high' in v)) {
    try {
      // si viene con toString
      if (typeof v.toString === 'function') return v.toString();
      // fallback: compón a partir de low/high (simplificado)
      const high = Number(v.high ?? 0);
      const low  = Number(v.low  ?? 0);
      return (high * 2**32 + (low >>> 0)).toString();
    } catch {
      return JSON.stringify(v);
    }
  }
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}