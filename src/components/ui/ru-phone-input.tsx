"use client";

import { useState } from "react";

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
  defaultValue?: string | null;
  name?: string;
};

export function RuPhoneInput({
  defaultValue,
  name = "phone",
  className,
  id,
  onBlur,
  onFocus,
  ...props
}: RuPhoneInputProps) {
  const initialDigits = extractRuPhoneDigits(defaultValue ?? "");
  const [display, setDisplay] = useState(() => displayRuPhoneFromStored(defaultValue));
  const [hidden, setHidden] = useState(() => toRuPhoneE164(initialDigits) ?? "");

  const syncFromInput = (raw: string) => {
    const digits = extractRuPhoneDigits(raw);
    setDisplay(formatRuPhoneMask(digits));
    setHidden(toRuPhoneE164(digits) ?? "");
  };

  return (
    <>
      <input type="hidden" name={name} value={hidden} />
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
          if (!display) {
            setDisplay("+7 ");
          }
          onFocus?.(e);
        }}
        onBlur={(e) => {
          if (display === "+7 " || display === "+7") {
            setDisplay("");
            setHidden("");
          }
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && (display === "+7 " || display === "+7")) {
            e.preventDefault();
            setDisplay("");
            setHidden("");
          }
        }}
        className={cn(className)}
      />
    </>
  );
}
