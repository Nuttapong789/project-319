export default function PawLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="5" cy="9" r="2.2" />
      <circle cx="9.5" cy="5" r="2.2" />
      <circle cx="14.5" cy="5" r="2.2" />
      <circle cx="19" cy="9" r="2.2" />
      <path d="M12 10.5c-3 0-6.5 4.2-6.5 7 0 2 1.6 2.8 3.3 2.8 1.3 0 2.1-.6 3.2-.6s1.9.6 3.2.6c1.7 0 3.3-.8 3.3-2.8 0-2.8-3.5-7-6.5-7z" />
    </svg>
  );
}
