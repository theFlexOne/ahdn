import { Link, NavLink } from 'react-router';

import { cn } from '@/lib/utils';

import AHDNLogo from './AHDNLogo';

export default function Header({ className }: { className?: string }) {
  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    cn('w-max transition-colors', isActive && 'text-red-600');

  return (
    <header
      className={cn(
        'fixed flex w-full items-center bg-black text-gray-200',
        'after:absolute after:bottom-0 after:left-0 after:h-4 after:w-full after:bg-[linear-gradient(to_top,#040404_0%,#020202_50%,#000000_100%)] after:content-[""]',
        className,
      )}
    >
      <div className="z-10 my-2 ml-8 shrink-0 basis-1/4">
        <Link to="/">
          <AHDNLogo className="h-14" />
        </Link>
      </div>
      <nav className="mr-8 ml-auto font-ahdn text-xl tracking-wider uppercase">
        <ul className="flex w-full items-center gap-8">
          <li className="flex flex-1 items-center">
            <NavLink to="/bio" className={navLinkClassName}>
              Bio
            </NavLink>
          </li>
          <li className="flex flex-1 items-center">
            <NavLink to="/schedule" className={navLinkClassName}>
              Schedule
            </NavLink>
          </li>
          <li className="flex flex-1 items-center">
            <NavLink to="/song-list" className={navLinkClassName}>
              Song List
            </NavLink>
          </li>
          <li className="flex flex-1 items-center">
            <NavLink to="/gallery" className={navLinkClassName}>
              Gallery
            </NavLink>
          </li>
          <li className="flex flex-1 items-center">
            <NavLink to="/contact" className={navLinkClassName}>
              Contact
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}
