import { Shield, Timer, Zap } from 'lucide-react';

const Benefits = () => {
  return (
    <section id="benefits" className="px-8 py-32">
      <div className="w-full">
        <div className="mx-auto flex max-w-screen-md flex-col justify-center gap-7 md:text-center">
          <p className="text-muted-foreground text-xs">Why cuse?</p>
          <h2 className="font-medium text-3xl lg:text-4xl">
            A better way to implement computer use
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-1 lg:mt-20 lg:grid-cols-3">
          <div className="relative flex gap-3 border-dashed md:block md:border-l md:p-5">
            <span className="mb-8 flex size-10 shrink-0 items-center justify-center bg-accent md:size-12">
              <Timer className="size-5 md:size-6" />
            </span>
            <div>
              <h3 className="font-medium md:mb-2 md:text-xl">
                Quick setup
                <span className="-left-px absolute hidden h-6 w-px bg-primary md:inline-block"></span>
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">
                Use the CLI to quickly set up your project and start
                implementing computer use.
              </p>
            </div>
          </div>
          <div className="relative flex gap-3 border-dashed md:block md:border-l md:p-5">
            <span className="mb-8 flex size-10 shrink-0 items-center justify-center bg-accent md:size-12">
              <Zap className="size-5 md:size-6" />
            </span>
            <div>
              <h3 className="font-medium md:mb-2 md:text-xl">
                Open source
                <span className="-left-px absolute hidden h-6 w-px bg-primary md:inline-block"></span>
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">
                cuse is open source and available for everyone to use and
                contribute to.
              </p>
            </div>
          </div>
          <div className="relative flex gap-3 border-dashed md:block md:border-l md:p-5">
            <span className="mb-8 flex size-10 shrink-0 items-center justify-center bg-accent md:size-12">
              <Shield className="size-5 md:size-6" />
            </span>
            <div>
              <h3 className="font-medium md:mb-2 md:text-xl">
                Reliability
                <span className="-left-px absolute hidden h-6 w-px bg-primary md:inline-block"></span>
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">
                Focus on implementing your application and let us handle the
                rest.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
