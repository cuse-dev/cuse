import { Button } from '@/components/ui/button';
import { FaDiscord } from 'react-icons/fa';

const Community = () => {
  return (
    <section className="py-32 px-8">
      <div className="w-full">
        <div className='flex items-center justify-center rounded-2xl border bg-[url("https://shadcnblocks.com/images/block/circles.svg")] bg-cover bg-center px-8 py-20 text-center md:p-20'>
          <div className="mx-auto max-w-screen-md">
            <h1 className="mb-4 text-balance text-2xl font-semibold md:text-5xl">
              Join the community
            </h1>
            <p className="text-muted-foreground md:text-lg">
              Connect with our community to stay up to date with the latest news
              and updates. Get in touch with us and other builders working on
              the same problems.
            </p>
            <div className="mt-11 flex flex-col justify-center gap-2 sm:flex-row">
              <Button size="lg" asChild>
                <a href="https://discord.gg/cuse" target="_blank">
                  <FaDiscord />
                  Join Discord
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Community;
