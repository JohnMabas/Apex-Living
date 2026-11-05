interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  centered?: boolean;
  light?: boolean;
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
  light = false,
}: SectionHeadingProps) {
  return (
    <div className={centered ? "text-center" : ""}>
      {eyebrow && (
        <p
          className={`text-xs font-semibold uppercase tracking-widest mb-3 ${
            light ? "text-soft-gold" : "text-soft-gold"
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={`font-display text-3xl sm:text-4xl font-semibold leading-tight mb-4 ${
          light ? "text-warm-ivory" : "text-forest-green"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`text-base leading-relaxed max-w-2xl ${
            centered ? "mx-auto" : ""
          } ${light ? "text-warm-ivory/75" : "text-charcoal/65"}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
