import { Button } from './ui/button';
import { Input } from './ui/input';

export default function NewsletterSignUp() {
  return (
    <div className="flex w-full border-t border-gray-700">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <p className="text-center font-semibold">Don't miss a show! Sign up for updates:</p>
        <div className="flex gap-2">
          <Input placeholder="Email" className="rounded-sm border-gray-400" />
          <Button className="rounded-sm">Sign Up</Button>
        </div>
      </div>
    </div>
  );
}
