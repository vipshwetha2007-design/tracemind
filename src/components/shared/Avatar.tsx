const SIZE_CLASSES = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-14 w-14 text-base",
} as const;

const PALETTE = [
  "bg-indigo-100 text-indigo-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
];

/** Deterministically picks a palette color from a string (e.g. a person id). */
function colorFor(seed: string) {
  const index = seed
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PALETTE[index % PALETTE.length];
}

interface AvatarProps {
  initials: string;
  size?: keyof typeof SIZE_CLASSES;
  seed?: string;
  className?: string;
}

/** Circular initials avatar, used anywhere a person is referenced. */
export default function Avatar({
  initials,
  size = "md",
  seed,
  className = "",
}: AvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${
        SIZE_CLASSES[size]
      } ${colorFor(seed ?? initials)} ${className}`}
    >
      {initials}
    </div>
  );
}
