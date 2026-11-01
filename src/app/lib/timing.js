export function createTimer(label) {
  const enabled = Boolean(process.env.LOG_TIMINGS);
  const startedAt = performance.now();

  function elapsed() {
    return Math.round(performance.now() - startedAt);
  }

  async function timed(name, query) {
    const result = await query;
    if (enabled) console.log(`[${label}] ${name}: done at ${elapsed()}ms`);
    return result;
  }

  function finish() {
    if (enabled) console.log(`[${label}] all queries done at ${elapsed()}ms`);
  }

  return { timed, finish };
}
