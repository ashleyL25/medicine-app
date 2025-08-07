export default function PillIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Two pill design */}
      <ellipse
        cx="8"
        cy="12"
        rx="3"
        ry="6"
        transform="rotate(-20 8 12)"
        fill="currentColor"
        opacity="0.8"
      />
      <ellipse
        cx="16"
        cy="12"
        rx="3"
        ry="6"
        transform="rotate(20 16 12)"
        fill="currentColor"
        opacity="0.8"
      />
      {/* Pill highlights for 3D effect */}
      <ellipse
        cx="7"
        cy="10"
        rx="1"
        ry="2"
        transform="rotate(-20 7 10)"
        fill="white"
        opacity="0.3"
      />
      <ellipse
        cx="17"
        cy="10"
        rx="1"
        ry="2"
        transform="rotate(20 17 10)"
        fill="white"
        opacity="0.3"
      />
    </svg>
  );
}
