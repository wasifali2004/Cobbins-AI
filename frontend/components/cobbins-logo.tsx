import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function CobbinsLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link href="/" className={cn("brand-lockup", className)} aria-label="Cobbins AI home">
      <span className="brand-mark">
        {/* Light mode: show black logo */}
        <Image
          src="/black-logo.png"
          alt=""
          width={30}
          height={30}
          className="logo-for-light"
          priority
        />
        {/* Dark mode: show white logo */}
        <Image
          src="/white-logo.png"
          alt=""
          width={30}
          height={30}
          className="logo-for-dark"
          priority
        />
      </span>
      {!compact && <span className="brand-name">Cobbins AI</span>}
    </Link>
  );
}
