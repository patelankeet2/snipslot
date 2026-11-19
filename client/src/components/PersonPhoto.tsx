interface Props {
  name: string;
  photoUrl?: string;
  className?: string;
}

// Round photo for a barber, falling back to their first initial
export function PersonPhoto({ name, photoUrl, className = 'avatar avatar-md' }: Props) {
  if (photoUrl) {
    return <img className={className} src={photoUrl} alt="" loading="lazy" />;
  }
  return (
    <span className={`${className} avatar-fallback`} aria-hidden="true">
      {name.charAt(0)}
    </span>
  );
}
