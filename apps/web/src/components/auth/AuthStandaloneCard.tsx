import Link from "next/link";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

interface Props {
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Shell compartido por forgot-password/reset-password/setup — en v1 cada
 * una repetía casi el mismo bloque (logo centrado + card) por separado.
 */
export function AuthStandaloneCard({ subtitle, children, footer }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-3 flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="mb-8 text-center">
          <Link href="/" className="font-heading text-2xl font-semibold tracking-[-0.02em]">
            GigBridge
          </Link>
          <p className="mt-2 text-sm text-neutral-700">{subtitle}</p>
        </div>

        <div className="card elev-md p-6">{children}</div>

        {footer && <div className="mt-5 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}
