'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ref, onDisconnect, remove, set, serverTimestamp } from 'firebase/database';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { ChatSidebar } from '@/components/chat/Sidebar';
import { useUser } from '@/hooks/useUser';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/');
      return;
    }

    const userRef = ref(db, `users/${user.userId}`);
    
    onDisconnect(userRef).update({ online: false, last_active: serverTimestamp() });

    set(userRef, {
        name: user.name,
        online: true,
        last_active: serverTimestamp()
    });

  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full p-4">
        <div className="w-64 mr-4 hidden md:block">
            <Skeleton className="h-full w-full" />
        </div>
        <div className="flex-1">
            <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
        <div className="flex h-screen bg-background">
            <Sidebar>
                <ChatSidebar currentUser={user} />
            </Sidebar>
            <SidebarInset>
              <main className="flex-1 flex flex-col h-screen">
                  {children}
              </main>
            </SidebarInset>
        </div>
    </SidebarProvider>
  );
}
