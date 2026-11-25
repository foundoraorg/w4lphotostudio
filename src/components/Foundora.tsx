/**
 * The Foundora identity.
 *
 * The three files in /public/images/brand are the supplied brand assets, used
 * unmodified — the lime is #C8F23D (the site accent) and the wordmark is
 * #101318 (the site night). Nothing here recolours or redraws them; the only
 * extra file is a mark-only crop taken from the same artwork, for dark
 * surfaces where the dark wordmark would disappear.
 */

const MARK = "/images/brand/foundora_mark.svg";
const WORDMARK = "/images/brand/foundora_wordmark.svg";
const HORIZONTAL = "/images/brand/foundora_horizontal.svg";

interface MarkProps {
  className?: string;
  /** Accessible name. Omit when the mark sits next to the name in text. */
  alt?: string;
}

export function FoundoraMark({ className = "", alt }: MarkProps) {
  return (
    <img
      src={MARK}
      alt={alt ?? ""}
      aria-hidden={alt ? undefined : true}
      width={600}
      height={600}
      draggable={false}
      className={`block ${className}`}
    />
  );
}

/** The standalone wordmark — dark ink, so only for light surfaces. */
export function FoundoraWordmark({ className = "", alt = "Foundora" }: MarkProps) {
  return (
    <img
      src={WORDMARK}
      alt={alt}
      width={1230}
      height={245}
      draggable={false}
      className={`block ${className}`}
    />
  );
}

interface LockupProps {
  className?: string;
  /** Wrap the lockup in a link to the Foundora site. */
  href?: string;
}

/** The horizontal lockup exactly as supplied: mark left, wordmark right. */
export function FoundoraLockup({ className = "", href }: LockupProps) {
  const logo = (
    <img
      src={HORIZONTAL}
      alt="Foundora"
      width={2123}
      height={820}
      draggable={false}
      className={`block ${className}`}
    />
  );

  if (!href) return logo;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Foundora — find better, live smarter"
      className="inline-block transition-opacity hover:opacity-80"
    >
      {logo}
    </a>
  );
}
