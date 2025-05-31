
'use client';

import Terminal from '@/components/terminal/terminal';
import { useAuth } from '@/hooks/use-auth-hook';

export default function TerminalPage() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen w-screen flex items-center justify-center bg-muted/20 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-3xl xl:max-w-4xl h-[70vh] sm:h-[75vh] md:h-[80vh] max-h-[600px] sm:max-h-[700px] md:max-h-[800px] bg-card rounded-lg shadow-2xl flex flex-col overflow-hidden border border-border">
        {/* Title Bar */}
        <div className="bg-secondary px-3 py-2 flex items-center gap-2 border-b border-border select-none">
          <div className="w-3 h-3 rounded-full bg-red-500 opacity-80 group-hover:opacity-100 cursor-pointer"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80 group-hover:opacity-100 cursor-pointer"></div>
          <div className="w-3 h-3 rounded-full bg-green-500 opacity-80 group-hover:opacity-100 cursor-pointer"></div>
          <span className="ml-auto text-xs text-muted-foreground font-medium">
            Noodlix -- {user ? user.username : 'guest'}@noodlix
          </span>
        </div>
        {/* Terminal Content */}
        <div className="flex-grow overflow-hidden bg-background">
          <Terminal />
        </div>
      </div>
    </main>
  );
}
