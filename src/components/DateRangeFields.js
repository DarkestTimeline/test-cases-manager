export default function DateRangeFields({ startDate, endDate, stacked = false }) {
  const inputClass =
    "border rounded p-2 text-sm h-9 flex-1 sm:flex-none focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:light]";
  const labelClass = `shrink-0${stacked ? " w-10" : ""}`;

  return (
    <>
      <label className="flex items-center gap-2 text-sm text-slate-600 w-full sm:w-auto">
        <span className={labelClass}>From</span>
        <input
          type="date"
          name="startDate"
          defaultValue={startDate || ""}
          className={inputClass}
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600 w-full sm:w-auto">
        <span className={labelClass}>To</span>
        <input
          type="date"
          name="endDate"
          defaultValue={endDate || ""}
          className={inputClass}
        />
      </label>
    </>
  );
}
