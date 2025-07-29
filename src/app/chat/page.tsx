'use client';

import { MessageSquareText } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

export default function ChatPage() {
  const { isMobile, toggleSidebar } = useSidebar();
  return (
    <div className="flex h-full flex-col items-center justify-center bg-secondary/50 rounded-l-lg">
      <div className="flex flex-col items-center text-center p-4">
        <MessageSquareText className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold font-headline text-muted-foreground">Welcome to ChatterEd</h2>
        <p className="text-muted-foreground mt-2">
          Select a user or a group to start a conversation.
        </p>
        {isMobile && 
            <button onClick={toggleSidebar} className="mt-4 text-primary hover:underline">
                Open Menu
            </button>
        }
      </div>
    </div>
  );
}
