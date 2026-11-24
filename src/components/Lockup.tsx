import { Link } from "react-router-dom";

interface LockupProps {
  to?: string;
  dark?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Lockup({ to = "/", dark = false, className = "", size = "md" }: LockupProps) {
  const nameSize = size === "lg" ? "text-[26px] sm:text-[30px]" : size === "sm" ? "text-[17px]" : "text-[19px] sm:text-[21px]";
  const subSize = size === "lg" ? "text-[11px] sm:text-[12px]" : "text-[10px] sm:text-[11px]";
  return (
    <Link to={to} className={`group inline-flex flex-col gap-1 ${className}`} aria-label="W4L Studios home">
      <span className={`font-serif font-medium leading-none tracking-[0.01em] ${nameSize} ${dark ? "text-wall" : "text-ink"}`}>
        W4L STUDIOS
      </span>
      <span className={`font-mono uppercase tracking-[0.16em] leading-tight ${subSize} ${dark ? "text-wall/60" : "text-muted"}`}>
        in association with{" "}
        <span className="inline-flex items-center gap-1">
          <span aria-hidden="true" className="inline-block h-[5px] w-[5px] translate-y-[-1px] rounded-full bg-accent" />
          FOUNDORA
        </span>
      </span>
    </Link>
  );
}
