'use client';

import { useUser } from '@/hooks/useUser';
import { ChatView } from '@/components/chat/ChatView';
import { Skeleton } from '@/components/ui/skeleton';

const groupChats: Record<string, {name: string}> = {
  'math-class': { name: 'Math Class' },
  'history-class': { name: 'History' },
  'science-club': { name: 'Science Club' },
  'literature-corner': { name: 'Literature Corner' },
};

export default function GroupChatPage({ params }: { params: { groupId: string } }) {
  const { user, loading } = useUser();
  const { groupId } = params;

  if (loading || !user) {
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

  const group = groupChats[groupId];
  if (!group) {
    return <div>Group not found</div>;
  }

  return <ChatView chatRoomId={groupId} currentUser={user} chatPartner={{id: groupId, name: group.name}} isGroupChat={true} />;
}
