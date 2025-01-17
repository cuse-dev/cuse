'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"

const Waitlist = () => {
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const email = formData.get('email');
        const response = await fetch('/api/waitlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });
        if (response.ok) {
            toast.success('Thanks for subscribing!');
        } else {
            toast.error('Something went wrong. Please try again.');
        }
    };
  return (
    <section id="waitlist" className="py-32 px-8">
      <div className="w-full">
        <div className="flex flex-col items-center text-center">
          <h3 className="mb-3 max-w-3xl text-2xl font-semibold md:mb-4 md:text-4xl lg:mb-6">
            Join the waitlist
          </h3>
          <p className="mb-8 max-w-3xl text-muted-foreground lg:text-lg">
            We are cooking up a managed service for you. Be the first to know when we launch.
            Along the way, we'll keep you updated on our progress.
          </p>
          <div className="w-full md:max-w-lg">
            <form onSubmit={handleSubmit} className="flex flex-col justify-center gap-2 sm:flex-row">
              <Input name="email" type="email" placeholder="Enter your email" />
              <Button type="submit" >Subscribe</Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Waitlist;
