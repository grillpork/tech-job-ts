import { getApiDocs } from '@/lib/swagger';
import ReactSwagger from './react-swagger';

export const metadata = {
  title: 'API Reference | Tech Job',
  description: 'API documentation for Tech Job',
};

export default async function IndexPage() {
  const spec = await getApiDocs();
  return (
    <section className="container max-w-7xl mx-auto p-4 bg-white dark:bg-zinc-950 min-h-screen">
      <ReactSwagger spec={spec} />
    </section>
  );
}
