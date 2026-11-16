"use client";

import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  displayRuPhoneFromStored,
  extractRuPhoneDigits,
  formatRuPhoneMask,
  RU_PHONE_MASK_MAX_LENGTH,
  RU_PHONE_MASK_PLACEHOLDER,
  toRuPhoneE164,
} from "@/lib/ru-phone";
import { cn } from "@/lib/utils";

type RuPhoneInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "defaultValue" | "onChange" | "inputMode"
> & {
  /** Uncontrolled initial (E.164 or free text). */
  defaultValue?: string | null;
  /** Controlled stored value (E.164 like +79001234567). */
  value?: string | null;
  /** Fires with E.164 when complete, otherwise null. */
  onValueChange?: (e164: string | null) => void;
  name?: string;
};

export function RuPhoneInput({
  defaultValue,
  value,
  onValueChange,
  name = "phone",
  className,
  id,
  onBlur,
  onFocus,
  ...props
}: RuPhoneInputProps) {
  const controlled = value !== undefined;
  const focusedRef = useRef(false);
  const initialDigits = extractRuPhoneDigits(
    (controlled ? value : defaultValue) ?? ""
  );
  const [display, setDisplay] = useState(() =>
    displayRuPhoneFromStored(controlled ? value : defaultValue)
  );
  const [hidden, setHidden] = useState(() => toRuPhoneE164(initialDigits) ?? "");

  useEffect(() => {
    if (!controlled) return;
    // While typing, parent often gets null for incomplete number — don't wipe mask.
    if (focusedRef.current && !value) return;
    setDisplay(displayRuPhoneFromStored(value));
    setHidden(toRuPhoneE164(extractRuPhoneDigits(value ?? "")) ?? "");
  }, [controlled, value]);

  const syncFromInput = (raw: string) => {
    const digits = extractRuPhoneDigits(raw);
    const nextDisplay = formatRuPhoneMask(digits);
    const nextE164 = toRuPhoneE164(digits);
    setDisplay(nextDisplay);
    setHidden(nextE164 ?? "");
    onValueChange?.(nextE164);
  };

  return (
    <>
      {!controlled ? <input type="hidden" name={name} value={hidden} /> : null}
      <Input
        {...props}
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder={RU_PHONE_MASK_PLACEHOLDER}
        maxLength={RU_PHONE_MASK_MAX_LENGTH}
        value={display}
        onChange={(e) => syncFromInput(e.target.value)}
        onFocus={(e) => {
          focusedRef.current = true;
          if (!display) {
            setDisplay("+7 ");
          }
          onFocus?.(e);
        }}
        onBlur={(e) => {
          focusedRef.current = false;
          if (display === "+7 " || display === "+7") {
            setDisplay("");
            setHidden("");
            onValueChange?.(null);
          }
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && (display === "+7 " || display === "+7")) {
            e.preventDefault();
            setDisplay("");
            setHidden("");
            onValueChange?.(null);
          }
        }}
        className={cn(className)}
      />
    </>
  );
}
