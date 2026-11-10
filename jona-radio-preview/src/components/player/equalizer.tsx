export function Equalizer({ active }: { active: boolean }) {
  return (
    <span className="flex items-end gap-[3px]" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[3px] origin-bottom rounded-full bg-current"
          style={{
            height: 16,
            transform: active ? undefined : "scaleY(0.3)",
            animation: active ? "equalize 0.9s ease-in-out infinite" : "none",
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </span>
  );
}
