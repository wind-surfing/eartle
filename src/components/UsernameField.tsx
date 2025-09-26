"use client";

import { useState, useEffect, useMemo } from "react";
import { FaCheck, FaXmark } from "react-icons/fa6";
import { Loader2, User } from "lucide-react";
import { checkUsernameUnique } from "@/supabase/rpc/auth";

type CheckResult = "unknown" | "unique" | "taken";

function isValidUsername(u: string): boolean {
  const t = u.trim();
  if (!t) return false;
  if (t.length < 2 || t.length > 20) return false;
  return /^[a-zA-Z0-9_]+$/.test(t);
}

interface UsernameFieldProps {
  className?: string;
  editProfile?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export default function UsernameField({
  className = "",
  editProfile = false,
  value,
  defaultValue,
  onChange,
}: UsernameFieldProps) {
  const [username, setUsername] = useState(defaultValue ?? "");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<CheckResult>("unknown");
  const [inputTouched, setInputTouched] = useState(false);

  useEffect(() => {
    if (value === undefined) {
      setUsername(defaultValue ?? "");
    }
  }, [defaultValue, value]);

  const current = value ?? username ?? "";
  const isOwnedSame =
    editProfile &&
    typeof defaultValue === "string" &&
    current.trim() === defaultValue;

  const canCheck = useMemo(() => isValidUsername(current), [current]);

  useEffect(() => {
    const trimmed = current.trim();

    if (!canCheck) {
      setResult("unknown");
      setIsChecking(false);
      return;
    }

    const isOwned =
      editProfile &&
      typeof defaultValue === "string" &&
      trimmed === defaultValue;
    if (isOwned) {
      setResult("unique");
      setIsChecking(false);
      return;
    }

    setResult("unknown");
    setIsChecking(true);
    const valueAtRequest = trimmed;
    const timer = setTimeout(async () => {
      try {
        const data = await checkUsernameUnique(valueAtRequest);
        if ((value ?? username).trim() !== valueAtRequest) return;
        const unique = data?.success === true;
        setResult(unique ? "unique" : "taken");
      } catch {
        setResult("unknown");
      } finally {
        setIsChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [current, canCheck, editProfile, defaultValue, value, username]);

  return (
    <div
      className={`input-field bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 relative ${className}`}
    >
      <User className="icon text-gray-600 dark:text-gray-300" />
      <input
        name="userName"
        type="text"
        placeholder="Username"
        value={current}
        onChange={(e) => {
          const next = e.target.value;
          if (onChange) onChange(next);
          if (value === undefined) setUsername(next);
        }}
        onBlur={() => setInputTouched(true)}
        required
        minLength={2}
        maxLength={20}
        pattern="^[a-zA-Z0-9_]+$"
        autoComplete="new-password"
        data-lpignore="true"
        data-form-type="other"
      />
      <div className="absolute flex h-full items-center right-3 top-0">
        {isChecking && (
          <Loader2 className="animate-spin w-4 h-4 text-gray-500 dark:text-gray-400" />
        )}
        {!isChecking &&
          (isOwnedSame ? (
            <FaCheck className="text-green-500 w-4 h-4" />
          ) : (
            inputTouched &&
            result !== "unknown" &&
            (result === "unique" ? (
              <FaCheck className="text-green-500 w-4 h-4" />
            ) : (
              <FaXmark className="text-red-500 w-4 h-4" />
            ))
          ))}
      </div>
    </div>
  );
}
