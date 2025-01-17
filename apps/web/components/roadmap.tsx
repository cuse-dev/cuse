const Roadmap = () => {
  return (
    <section id="roadmap" className="py-32 px-8">
      <div className="w-full">
        <div className="mx-auto flex max-w-screen-md flex-col justify-center gap-7 md:text-center">
          <h2 className="text-2xl md:text-4xl font-semibold">Roadmap</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            We want to become the go-to tool for implementing computer use in
            your applications. This is the list of what to be excited about in
            the near future.
          </p>
        </div>
        <div className="mx-auto mt-14 flex max-w-screen-lg flex-col gap-4 lg:px-16">
          <div className="flex flex-col items-center justify-between min-[960px]:flex-row min-[960px]:gap-10">
            <div className="flex gap-4 min-[960px]:max-w-md">
              <div className="flex flex-col items-center justify-between gap-1">
                <span className="h-20 shrink-0"></span>
                <span className="flex size-10 shrink-0 items-center justify-center border bg-muted/50 font-mono text-lg">
                  1
                </span>
                <span className="h-20 w-[3px] shrink-0 bg-gradient-to-b from-transparent to-primary opacity-70"></span>
              </div>
              <div className="flex flex-col justify-center gap-5 px-0 min-[960px]:gap-6 min-[960px]:px-4 min-[960px]:py-4">
                <h3 className="text-xl min-[960px]:text-2xl">Authentication</h3>
                <p className="text-sm text-muted-foreground min-[960px]:text-base">
                  Having the agent not only interact with publicly available
                  sites, but also with content that is only available to
                  authenticated users.
                </p>
              </div>
            </div>
            <img
              src="https://shadcnblocks.com/images/block/placeholder-1.svg"
              alt="placeholder"
              className="z-10 aspect-video w-full border object-cover min-[960px]:max-h-56 min-[960px]:w-auto"
            />
          </div>
          <div className="flex flex-col items-center justify-between min-[960px]:flex-row min-[960px]:gap-10">
            <div className="flex gap-4 min-[960px]:max-w-md">
              <div className="relative flex flex-col items-center justify-between gap-1">
                <span className="absolute -top-8 mx-auto h-8 w-[3px] shrink-0 bg-primary opacity-70"></span>
                <span className="absolute -bottom-8 mx-auto h-8 w-[3px] shrink-0 bg-primary opacity-70"></span>
                <span className="h-20 w-[3px] shrink-0 bg-primary opacity-70"></span>
                <span className="flex size-10 shrink-0 items-center justify-center border bg-muted/50 font-mono text-lg">
                  2
                </span>
                <span className="h-20 w-[3px] shrink-0 bg-primary opacity-70"></span>
              </div>
              <div className="flex flex-col justify-center gap-5 px-0 min-[960px]:gap-6 min-[960px]:px-4 min-[960px]:py-4">
                <h3 className="text-xl min-[960px]:text-2xl">Workflows</h3>

                <p className="text-sm text-muted-foreground min-[960px]:text-base">
                  Being able to define and reuse a series of actions to be
                  performed by the agent greatly increases the speed and
                  effectiveness of the agent.
                </p>
              </div>
            </div>

            <img
              src="https://shadcnblocks.com/images/block/placeholder-2.svg"
              alt="placeholder"
              className="z-10 max-h-56 w-full  border object-cover min-[960px]:aspect-video min-[960px]:w-auto"
            />
          </div>
          <div className="flex flex-col items-center justify-between min-[960px]:flex-row min-[960px]:gap-10">
            <div className="flex gap-4 min-[960px]:max-w-md">
              <div className="flex flex-col items-center justify-between gap-1">
                <span className="h-20 w-[3px] shrink-0 bg-gradient-to-t from-transparent to-primary opacity-70"></span>
                <span className="flex size-10 shrink-0 items-center justify-center border bg-muted/50 font-mono text-lg">
                  3
                </span>
                <span className="h-20 shrink-0"></span>
              </div>
              <div className="flex flex-col justify-center gap-5 px-0 min-[960px]:gap-6 min-[960px]:px-4 min-[960px]:py-4">
                <h3 className="text-xl min-[960px]:text-2xl">More to come</h3>

                <p className="text-sm text-muted-foreground min-[960px]:text-base">
                  We have a lot of ideas and would love to hear your feedback.
                  Are you interested in observability, other platforms,
                  security, or a managed service?
                </p>
              </div>
            </div>
            <img
              src="https://shadcnblocks.com/images/block/placeholder-3.svg"
              alt="placeholder"
              className="z-10 max-h-56 w-full  border object-cover min-[960px]:aspect-video min-[960px]:w-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Roadmap;
