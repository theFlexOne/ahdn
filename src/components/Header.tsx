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
      <div className='shrink-0 basis-1/4 z-10 ml-8 my-2'>
        <Link to="/">
          <AHDNLogo className="h-14" />
        </Link>
      </div>
      <nav className="ml-auto mr-8 text-xl uppercase font-ahdn tracking-wider">
        <ul className="flex gap-8 w-full items-center">
          <li className="flex flex-1 items-center">
            <Link to="/bio" className='w-max'>Bio</Link>
          </li>
          <li className="flex flex-1 items-center">
            <Link to="/schedule" className='w-max'>Schedule</Link>
          </li>
          <li className="flex flex-1 items-center">
            <Link to="/song-list" className='w-max'>Song List</Link>
          </li>
          <li className="flex flex-1 items-center">
            <Link to="/gallery" className='w-max'>Gallery</Link>
          </li>
          <li className="flex flex-1 items-center">
            <Link to="/contact" className='w-max'>Contact</Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
