function isBsonLong(v) {
  return v && typeof v === 'object' &&
    v.low !== undefined && v.high !== undefined && v.unsigned !== undefined;
}
function toBsonLongString(v) {
  const hi = BigInt(v.high | 0);
  const lo = BigInt(v.low >>> 0);
  const num = (hi << 32n) + lo;
  return v.unsigned ? (num >>> 0n).toString() : num.toString();
}
function isDecimal128(v) {
  return v && (v._bsontype === 'Decimal128');
}
function isObjectId(v) {
  return v && v._bsontype === 'ObjectId';
}

function bsonToJsonSafe(input) {
  if (Array.isArray(input)) return input.map(bsonToJsonSafe);
  if (input && typeof input === 'object') {
    if (isBsonLong(input))   return toBsonLongString(input);
    if (isDecimal128(input)) return input.toString();
    if (isObjectId(input))   return input.toString();
    const out = {};
    for (const [k, v] of Object.entries(input)) out[k] = bsonToJsonSafe(v);
    return out;
  }
  return input;
}

module.exports = { bsonToJsonSafe, toBsonLongString };