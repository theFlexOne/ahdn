import { Link } from 'react-router';

import { cn } from '@/lib/utils';

import AHDNLogo from './AHDNLogo';

export default function Header({ className }: { className?: string }) {
  return (
    <header className={cn(
      'flex bg-black w-full fixed items-center text-gray-200',
      'after:content-[""] after:absolute after:w-full after:h-4 after:bg-[linear-gradient(to_top,#040404_0%,#020202_50%,#000000_100%)] after:bottom-0 after:left-0',
      className
    )}>
      <div className='shrink-0 basis-1/4 z-10 ml-4 my-2'>
        <AHDNLogo className="h-14" />
      </div>
      <nav className="flex-1 min-w-0 text-xl uppercase font-ahdn tracking-wider">
        <ul className="flex w-full items-center">
          <li className="flex flex-1 items-center justify-center">
            <Link to="/bio">Bio</Link>
          </li>
          <li className="flex flex-1 items-center justify-center">
            <Link to="/schedule">Schedule</Link>
          </li>
          <li className="flex flex-1 items-center justify-center">
            <Link to="/song-list">Song List</Link>
          </li>
          <li className="flex flex-1 items-center justify-center">
            <Link to="/gallery">Gallery</Link>
          </li>
          <li className="flex flex-1 items-center justify-center">
            <Link to="/contact">Contact</Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
