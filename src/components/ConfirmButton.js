"use client";

import { useState } from "react";
import Button from "./Button";

export default function ConfirmButton({
  children,
  message,
  variant = "ghostDanger",
  ...rest
}) {
  const [formEl, setFormEl] = useState(null);

  function handleClick(e) {
    setFormEl(e.currentTarget.form);
  }

  function handleConfirm() {
    formEl.requestSubmit();
    setFormEl(null);
  }

  return (
    <>
      <Button onClick={handleClick} variant={variant} {...rest} type="button">
        {children}
      </Button>

      {formEl && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setFormEl(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-slate-800 mb-4">{message}</p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setFormEl(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleConfirm}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
