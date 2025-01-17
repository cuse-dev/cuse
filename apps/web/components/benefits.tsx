import { Shield, Timer, Zap } from 'lucide-react';

const Benefits = () => {
  return (
    <section id="benefits" className="py-32 px-8">
      <div className="w-full">
        <div className="mx-auto flex max-w-screen-md flex-col justify-center gap-7 md:text-center">
          <p className="text-xs text-muted-foreground">Why cuse?</p>
          <h2 className="text-3xl font-medium lg:text-4xl">
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
                <span className="absolute -left-px hidden h-6 w-px bg-primary md:inline-block"></span>
              </h3>
              <p className="text-sm text-muted-foreground md:text-base">
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
                <span className="absolute -left-px hidden h-6 w-px bg-primary md:inline-block"></span>
              </h3>
              <p className="text-sm text-muted-foreground md:text-base">
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
                <span className="absolute -left-px hidden h-6 w-px bg-primary md:inline-block"></span>
              </h3>
              <p className="text-sm text-muted-foreground md:text-base">
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
