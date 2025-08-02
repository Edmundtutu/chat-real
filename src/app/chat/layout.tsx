'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ref, onDisconnect, remove, set, serverTimestamp } from 'firebase/database';
import { Sidebar } from '@/components/chat/Sidebar';
import { useUser } from '@/hooks/useUser';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const isChatPage = pathname.startsWith('/chat/user/') || pathname.startsWith('/chat/group/');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/');
      return;
    }

    const userRef = ref(db, `users/${user.userId}`);
    const presenceRef = ref(db, `.info/connected`);

    onDisconnect(userRef).remove();

    set(userRef, {
        name: user.name,
        online: true,
        last_active: serverTimestamp()
    });

    return () => {
      remove(userRef);
    };
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full p-4">
        <div className="w-80 mr-4 hidden lg:block">
            <Skeleton className="h-full w-full" />
        </div>
        <div className="flex-1">
            <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
        <div className={cn("lg:w-80 lg:flex-shrink-0 h-full", isChatPage ? "hidden lg:block" : "w-full")}>
            <Sidebar currentUser={user} />
        </div>
        <main className={cn("flex-1 flex-col", isChatPage ? "flex" : "hidden lg:flex")}>
            <div className="w-full max-w-[1400px] mx-auto h-full flex">
                {children}
            </div>
        </main>
    </div>
  );
}
