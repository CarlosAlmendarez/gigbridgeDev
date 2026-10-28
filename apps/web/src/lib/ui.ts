// Small className builders that mirror the style helpers from the original
// prototype (navStyle/chipStyle/dateChipStyle in the .dc.html script),
// translated to Tailwind utility classes bound to the ported design tokens.

export function navClass(active: boolean) {
  return [
    "flex items-center gap-3 min-h-11 px-[10px] py-2 rounded-md text-left font-body cursor-pointer",
    active ? "bg-accent-100 text-accent-800" : "bg-transparent text-text",
  ].join(" ");
}

export function chipClass(active: boolean, small = false) {
  return [
    "inline-flex flex-none items-center justify-center whitespace-nowrap cursor-pointer rounded-md border font-body text-[13px]",
    small ? "min-h-9 px-[11px] py-[5px]" : "min-h-10 px-3.5 py-1.5",
    active ? "bg-accent border-accent text-bg" : "bg-transparent border-divider text-text",
  ].join(" ");
}

export function dateChipClass(active: boolean) {
  return [
    "flex flex-col items-center gap-[3px] min-w-[68px] min-h-[78px] px-2.5 py-2 rounded-md border cursor-pointer",
    active ? "bg-accent border-accent text-bg" : "bg-transparent border-divider text-text",
  ].join(" ");
}
