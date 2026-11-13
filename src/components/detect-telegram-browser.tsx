import Script from "next/script";

/**
 * Marks html[data-tg-browser] before paint when opened inside Telegram’s
 * in-app browser (iOS especially stacks its chrome above our fixed header).
 */
export function DetectTelegramBrowser() {
  return (
    <Script id="detect-tg-browser" strategy="beforeInteractive">{`(function(){try{var ua=navigator.userAgent||"";if(/Telegram/i.test(ua)||"TelegramWebviewProxy" in window){document.documentElement.setAttribute("data-tg-browser","");}}catch(e){}})();`}</Script>
  );
}
