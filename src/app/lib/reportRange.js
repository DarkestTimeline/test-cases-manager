function formatDay(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function resolveRange({ weeks, startDate, endDate }) {
  const isCustomRange = Boolean(startDate || endDate);
  const rangeIsBackwards = Boolean(startDate && endDate && startDate > endDate);
  const weeksToShow = Math.min(Math.max(parseInt(weeks) || 12, 1), 520);

  if (isCustomRange) {
    let rangeShort;
    let rangePhrase;
    if (startDate && endDate) {
      rangeShort = `${formatDay(startDate)} to ${formatDay(endDate)}`;
      rangePhrase = `from ${rangeShort}`;
    } else if (startDate) {
      rangeShort = `since ${formatDay(startDate)}`;
      rangePhrase = rangeShort;
    } else {
      rangeShort = `up to ${formatDay(endDate)}`;
      rangePhrase = rangeShort;
    }
    return {
      isCustomRange,
      rangeIsBackwards,
      weeksToShow,
      rangeStart: startDate,
      rangeEnd: endDate ? `${endDate}T23:59:59` : null,
      rangeShort,
      rangePhrase,
    };
  }

  const start = new Date();
  start.setDate(start.getDate() - weeksToShow * 7);
  const rangeShort = `last ${weeksToShow} weeks`;
  return {
    isCustomRange,
    rangeIsBackwards,
    weeksToShow,
    rangeStart: start.toISOString(),
    rangeEnd: null,
    rangeShort,
    rangePhrase: `in the ${rangeShort}`,
  };
}
