"use client";

import { useFormStatus } from "react-dom";
import Button from "./Button";

export default function FormSubmitButton({
  children,
  pendingLabel = "Working…",
  ...rest
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...rest}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
