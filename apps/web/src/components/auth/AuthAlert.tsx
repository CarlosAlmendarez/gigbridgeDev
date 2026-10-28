import { Icon } from "@/components/Icon";

interface Props {
  variant: "error" | "success";
  children: React.ReactNode;
}

export function AuthAlert({ variant, children }: Props) {
  const isError = variant === "error";
  return (
    <div
      className={[
        "mb-3.5 flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-[13px]",
        isError ? "border-red-300 bg-red-50 text-red-700" : "border-green-300 bg-green-50 text-green-700",
      ].join(" ")}
    >
      <Icon name={isError ? "warning-circle" : "check-circle"} size={16} className="mt-0.5 flex-shrink-0" />
      <div>{children}</div>
    </div>
  );
}
