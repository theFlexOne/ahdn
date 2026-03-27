import { Button } from './ui/button';
import { Input } from './ui/input';

export default function NewsletterSignUp() {
  return (
    <div className="w-full border-t border-gray-700 flex">
      <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
        <p className="font-semibold text-center">Don't miss a show! Sign up for updates:</p>
        <div className="flex gap-2">
          <Input placeholder="Email" className="border-gray-400 rounded-sm" />
          <Button className="rounded-sm">Sign Up</Button>
        </div>
      </div>
    </div>
  );
}
