import Link from "next/link";
import { Space_Grotesk } from "next/font/google";

const brandFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-brand",
});

export function TaskflowLogo({
  withLink = true,
  subtitle,
}: {
  withLink?: boolean;
  subtitle?: string;
}) {
  const content = (
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-2xl bg-[color:var(--color-surface-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]" />
      <div>
        <div
          className={`${brandFont.variable} font-[family-name:var(--font-brand)] text-[1.85rem] font-semibold tracking-[-0.04em] text-[color:var(--color-text-primary)]`}
        >
          Taskflow
        </div>
        {subtitle ? (
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (!withLink) {
    return content;
  }

  return <Link href="/projects">{content}</Link>;
}
