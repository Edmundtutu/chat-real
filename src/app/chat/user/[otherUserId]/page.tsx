'use client';

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { useUser } from '@/hooks/useUser';
import { db } from '@/lib/firebase';
import { getChatRoomId } from '@/lib/utils';
import { ChatView } from '@/components/chat/ChatView';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserChatPage({ params: { otherUserId } }: { params: { otherUserId: string } }) {
  const { user, loading: userLoading } = useUser();
  const [otherUser, setOtherUser] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userRef = ref(db, `users/${otherUserId}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setOtherUser(snapshot.val());
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [otherUserId]);

  if (userLoading || loading || !user || !otherUser) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-16 w-3/4 ml-auto" />
          <Skeleton className="h-16 w-1/2" />
        </div>
        <div className="p-4 border-t">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  const chatRoomId = getChatRoomId(user.userId, otherUserId);

  return <ChatView chatRoomId={chatRoomId} currentUser={user} chatPartner={{id: otherUserId, name: otherUser.name}} isGroupChat={false} />;
}
