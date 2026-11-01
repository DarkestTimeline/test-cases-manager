export function formatId(prefix, seqNumber) {
  if (!seqNumber) return null
  return `${prefix}-${String(seqNumber).padStart(2, '0')}`
}