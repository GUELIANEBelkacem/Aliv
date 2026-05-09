import { AppShell } from '@aliv/ui';
import { Hero } from './sections/Hero';
import { AppGrid } from './sections/AppGrid';
import { Manifesto } from './sections/Manifesto';
import { Footer } from './sections/Footer';

export default function App() {
  return (
    <AppShell appId="web" footer={<Footer />}>
      <main className="web-main">
        <Hero />
        <AppGrid />
        <Manifesto />
      </main>
    </AppShell>
  );
}
