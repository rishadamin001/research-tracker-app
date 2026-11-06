import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Research Atlas — A clearer path to discovery', description: 'Your free, local-first workspace for learning, planning, and documenting academic research.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
