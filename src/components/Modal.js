"use client";

import { useEffect, useRef } from "react";

const SIZES = { sm: "max-w-sm", md: "max-w-md" };

export default function Modal({ onClose, label, size = "md", children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] ${SIZES[size]} rounded-lg bg-white p-0 shadow-lg backdrop:bg-black/40`}
    >
      <div className="p-6">{children}</div>
    </dialog>
  );
}
