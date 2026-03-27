import { cn } from '@/lib/utils';
import FacebookBadge from '@/assets/badges/fb_badge_outline.svg?react';
import YoutubeBadge from '@/assets/badges/yt_badge_outline.svg?react';
import XBadge from '@/assets/badges/x_badge_outline.svg?react';

export default function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        'relative flex flex-col items-center justify-center gap-4 bg-black px-4 py-6 text-gray-200',
        'after:absolute after:top-0 after:left-0 after:h-4 after:w-full after:bg-[linear-gradient(to_bottom,#040404_0%,#020202_50%,#000000_100%)] after:content-[""]',
        className,
      )}
    >
      <ul className="flex gap-4">
        <li>
          <a href="/">
            <FacebookBadge className="h-10 w-10" />
          </a>
        </li>
        <li>
          <a href="/">
            <YoutubeBadge className="h-10 w-10" />
          </a>
        </li>
        <li>
          <a href="/">
            <XBadge className="h-10 w-10" />
          </a>
        </li>
      </ul>
      <p className="text-sm">©2013 A Hard Day's Night</p>
    </footer>
  );
}
