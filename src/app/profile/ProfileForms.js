"use client";

import { useActionState } from "react";
import { updateDisplayName, updatePassword } from "./actions";
import Button from "@/components/Button";

const nameInitialState = { error: null, success: null };
const passwordInitialState = { error: null, success: null };

export default function ProfileForms({ displayName }) {
  const [nameState, nameFormAction, isNamePending] = useActionState(
    updateDisplayName,
    nameInitialState,
  );
  const [passwordState, passwordFormAction, isPasswordPending] = useActionState(
    updatePassword,
    passwordInitialState,
  );

  return (
    <>
      <form action={nameFormAction} className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Display Name</h3>
        {nameState.error && (
          <p className="text-danger text-sm">{nameState.error}</p>
        )}
        {nameState.success && (
          <p className="text-success text-sm">{nameState.success}</p>
        )}
        <input
          type="text"
          name="displayName"
          defaultValue={displayName}
          required
          className="w-full border rounded p-2"
        />
        <Button type="submit" size="sm" disabled={isNamePending}>
          {isNamePending ? "Saving..." : "Save Name"}
        </Button>
      </form>

      <form action={passwordFormAction} className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Change Password
        </h3>
        {passwordState.error && (
          <p className="text-danger text-sm">{passwordState.error}</p>
        )}
        {passwordState.success && (
          <p className="text-success text-sm">{passwordState.success}</p>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">
            Current Password
          </label>
          <input
            type="password"
            name="currentPassword"
            required
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input
            type="password"
            name="newPassword"
            required
            minLength={6}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={6}
            className="w-full border rounded p-2"
          />
        </div>
        <Button type="submit" size="sm" disabled={isPasswordPending}>
          {isPasswordPending ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </>
  );
}
