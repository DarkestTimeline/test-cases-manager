"use client";

import { useState } from "react";
import Button from "./Button";
import Modal from "./Modal";

export default function ConfirmButton({
  children,
  message,
  variant = "ghostDanger",
  confirmVariant = "danger",
  ...rest
}) {
  const [formEl, setFormEl] = useState(null);

  function handleConfirm() {
    formEl.requestSubmit();
    setFormEl(null);
  }

  return (
    <>
      <Button
        onClick={(e) => setFormEl(e.currentTarget.form)}
        variant={variant}
        {...rest}
        type="button"
      >
        {children}
      </Button>

      {formEl && (
        <Modal size="sm" label={message} onClose={() => setFormEl(null)}>
          <p className="text-slate-800 mb-4">{message}</p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setFormEl(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={confirmVariant}
              size="md"
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
