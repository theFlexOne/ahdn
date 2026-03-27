import { useState } from 'react';

import { cn } from '@/lib/utils';

type PauseButtonProps = {
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
};

const sizeClasses = {
  sm: 'size-12',
  md: 'size-16',
  lg: 'size-20',
} as const;

export function PauseButton({
  onClick,
  className,
  size = 'md',
  ariaLabel = 'Pause',
}: PauseButtonProps) {
  const [isPaused, setIsPaused] = useState(false);
  const sizeClass = sizeClasses[size];

  function handleClick() {
    setIsPaused(!isPaused);
    onClick?.();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={cn(
        'group inline-flex shrink-0 items-center justify-center rounded-full text-white/75 transition-[transform,color] duration-200 ease-out outline-none',
        'hover:scale-[1.03] hover:text-white active:scale-[0.97]',
        'focus-visible:scale-[1.03] focus-visible:text-white focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40',
        sizeClass,
        className,
      )}
    >
      <svg
        aria-hidden="true"
        className="size-full"
        viewBox="0 0 500 500"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          id="bg"
          cx="250"
          cy="250"
          r="232"
          className="fill-black/10 stroke-current transition-[fill] duration-200 group-hover:fill-white/5 group-focus-visible:fill-black/25"
          strokeWidth="0.5"
        />
        {isPaused ? (
          <path
            id="play"
            d="M0.250255 6.00893C0.250316 1.58265 5.04169 -1.18366 8.87499 1.02943L309.625 174.667C313.459 176.88 313.458 182.414 309.625 184.627L8.87547 358.265C5.0422 360.478 0.249911 357.712 0.249757 353.285L0.250255 6.00893Z"
            transform="translate(167.0648 120.654) scale(0.72)"
            className="fill-none stroke-current group-hover:fill-white/50"
            strokeWidth="2"
          />
        ) : (
          <g id="pause" strokeWidth="1">
            <rect
              x="156"
              y="120"
              width="56"
              height="260"
              rx="12"
              className="fill-none stroke-current group-hover:fill-white/50"
            />
            <rect
              x="288"
              y="120"
              width="56"
              height="260"
              rx="12"
              className="fill-none stroke-current group-hover:fill-white/50"
            />
          </g>
        )}
      </svg>
    </button>
  );
}
