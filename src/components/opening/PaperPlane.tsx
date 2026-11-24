/**
 * The paper plane that carries the opening: ink upper wing, bronze
 * underside, nose pointing along +x so the flight rotation reads naturally.
 * Drawn inline — no external sticker sheet, no travel-studio artwork.
 */
export function PaperPlane() {
  return (
    <div className="op-plane" aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" focusable="false">
        <path d="M60 32 6 7 24 32Z" fill="var(--ink, #29211d)" />
        <path d="M60 32 6 57 24 32Z" fill="var(--bronze, #b97953)" />
        <path d="M24 32 6 7v50Z" fill="var(--ink, #29211d)" opacity="0.55" />
        <path
          d="M60 32 24 32"
          stroke="var(--page, #f8f6f0)"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}
