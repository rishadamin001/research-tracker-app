import { Compass } from 'lucide-react';
import { AtlasDialog } from '../shared/AtlasDialog';
export function WelcomeDialog({ start, explore, skip }: { start: () => void; explore: () => void; skip: () => void }) {
  return <AtlasDialog title="Welcome to Research Atlas" description="Turn your interests into a research project, one step at a time." onClose={skip}>
    <div className="welcome-path" aria-hidden="true"><Compass/><span>Explore</span><i/><span>Gather evidence</span><i/><span>Write</span></div>
    <div className="button-row"><button data-initial-focus className="button" onClick={start}>Take a quick tour</button><button className="button secondary" onClick={explore}>Start exploring</button><button className="text-button" onClick={skip}>Skip for now</button></div>
  </AtlasDialog>;
}
