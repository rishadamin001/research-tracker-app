import { BookOpen, Compass, FolderPlus, LibraryBig, Map, Search, Send } from 'lucide-react';

export const tourSteps = [
  { target: 'overview', title: 'Your starting point', icon: Compass, text: 'Home brings together your active project and the next useful step.' },
  { target: 'new-project', title: 'Start a project', icon: FolderPlus, text: 'Give your idea a working title. Your sources, decisions and draft will stay together.' },
  { target: 'paper-search', title: 'Discover papers', icon: Search, text: 'Search scholarly databases by topic, then compare papers and save promising ones.' },
  { target: 'library', title: 'Keep your sources', icon: LibraryBig, text: 'Library brings together the papers you have saved across your projects.' },
  { target: 'roadmap', title: 'Do the research', icon: Map, text: 'My Research connects your question, screening decisions, evidence, notebook and writing.' },
  { target: 'guide', title: 'Learn by doing', icon: BookOpen, text: 'Try a short exercise, see feedback and apply the skill to your project.' },
  { target: 'publish-hub', title: 'Explore where to publish', icon: Send, text: 'Compare journals and conferences. Check the organizer, scope and fees before submitting.' },
] as const;
