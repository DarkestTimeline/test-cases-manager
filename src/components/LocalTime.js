"use client";

import { useSyncExternalStore } from "react";

const FORMATS = {
  date: { month: "short", day: "numeric", year: "numeric" },
  monthday: { month: "short", day: "numeric" },
  datetime: {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
};

const subscribe = () => () => {};

// Shows a timestamp in the viewer's own time zone. The server renders it in
// UTC and the browser swaps in local time right after hydration, so there is
// no hydration mismatch.
export default function LocalTime({ value, format = "datetime" }) {
  const options = FORMATS[format] ?? FORMATS.datetime;
  const text = useSyncExternalStore(
    subscribe,
    () => new Date(value).toLocaleString(undefined, options),
    () =>
      new Date(value).toLocaleString("en-US", { ...options, timeZone: "UTC" }),
  );

  return <time dateTime={value}>{text}</time>;
}
