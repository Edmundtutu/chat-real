'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ref, onDisconnect, remove, set, serverTimestamp } from 'firebase/database';
import { Sidebar } from '@/components/chat/Sidebar';
import { useUser } from '@/hooks/useUser';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

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
        <div className="w-64 mr-4">
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
      <Sidebar currentUser={user} />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
