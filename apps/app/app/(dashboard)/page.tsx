import type { Metadata } from 'next';
import { ComputerSummary } from './components/computer-summary';
import { Header } from './components/header';
import { Main } from './components/main';
import { UsageSummary } from './components/usage-summary';

const title = 'Cuse';
const description = 'AI-controlled computer.';

export const metadata: Metadata = {
  title,
  description,
};

const App = async () => {
  return (
    <>
      <div className="flex h-full flex-col space-y-2 pb-2">
        <Header pages={[]} page="Home">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h1 className="font-bold text-2xl tracking-tight">
                Your Dashboard
              </h1>
              <p className="text-muted-foreground">Everything at a glance.</p>
            </div>
          </div>
        </Header>
        <Main>
          <div className="grid w-full grid-cols-2 gap-4 pt-0 xl:grid-cols-4">
            <ComputerSummary />
            <UsageSummary />
          </div>
        </Main>
      </div>
    </>
  );
};

export default App;
