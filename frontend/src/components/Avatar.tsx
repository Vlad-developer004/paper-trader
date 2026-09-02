export function Avatar({ size = 40 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 40 40">
        <defs>
          <clipPath id="avatarClip">
            <circle cx="20" cy="20" r="19" />
          </clipPath>
        </defs>
        <g clipPath="url(#avatarClip)">
          <circle cx="20" cy="20" r="19" fill="oklch(0.85 0.06 55)" />
          <circle cx="20" cy="16.5" r="6.5" fill="white" fillOpacity="0.85" />
          <ellipse cx="20" cy="39" rx="13.5" ry="13" fill="white" fillOpacity="0.85" />
        </g>
      </svg>
      <div
        className="absolute bottom-0 right-0 rounded-full border-2 border-bg"
        style={{ width: size * 0.28, height: size * 0.28, background: "oklch(0.7 0.16 150)" }}
      />
    </div>
  );
}
