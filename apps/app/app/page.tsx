import { createMetadata } from '@repo/seo/metadata';
import type { Metadata } from 'next';

const meta = {
  title: 'cuse',
  description: 'computer use',
};

export const metadata: Metadata = createMetadata(meta);

const Home = () => {
  return <>Home</>;
};

export default Home;
