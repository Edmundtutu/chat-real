'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import { db } from '@/lib/firebase';
import { User as UserIcon, Users as UsersIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/hooks/useUser';
import { getChatRoomId } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { useSidebar } from '../ui/sidebar';

interface OnlineUser {
  name: string;
  userId: string;
  online: boolean;
}

const groupChats = [
  { id: 'math-class', name: 'Math Class' },
  { id: 'history-class', name: 'History' },
  { id: 'science-club', name: 'Science Club' },
  { id: 'literature-corner', name: 'Literature Corner' },
];

export function ChatSidebar({ currentUser }: { currentUser: User }) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    const usersRef = query(ref(db, 'users'), orderByChild('name'));
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const usersData: OnlineUser[] = [];
      snapshot.forEach((childSnapshot) => {
        const userId = childSnapshot.key;
        if (userId !== currentUser.userId) {
          usersData.push({ userId, ...childSnapshot.val() });
        }
      });
      setOnlineUsers(usersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser.userId]);

  // Unread message listener
   useEffect(() => {
    if (!currentUser) return;
    const allUserChatIds = onlineUsers.map(user => getChatRoomId(currentUser.userId, user.userId));

    const unsubscribes = [...allUserChatIds, ...groupChats.map(g => g.id)].map(chatId => {
      const messagesRef = ref(db, `chats/${chatId}/messages`);
      const q = query(messagesRef, orderByChild('timestamp'));
      return onValue(q, (snapshot) => {
        if (snapshot.exists() && !pathname.endsWith(chatId)) {
            const messages = Object.values(snapshot.val());
            if (messages.length > 0) {
              const lastMessage = messages[messages.length - 1] as any;
              if (lastMessage.senderId !== currentUser.userId) {
                   setUnreadMessages(prev => ({ ...prev, [chatId]: true }));
              }
            }
        }
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
   }, [onlineUsers, currentUser, pathname]);


   const handleChatSelection = (chatId: string) => {
     if(unreadMessages[chatId]) {
        setUnreadMessages(prev => {
            const newUnread = {...prev};
            delete newUnread[chatId];
            return newUnread;
        });
     }
     setOpenMobile(false);
   }

  return (
    <div className="w-full h-full bg-secondary/30 border-r flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold font-headline text-primary-foreground">ChatterEd</h1>
        <p className="text-sm text-muted-foreground">Welcome, {currentUser.name}</p>
      </div>
      <Tabs defaultValue="users" className="flex-1 flex flex-col">
        <TabsList className="m-2">
          <TabsTrigger value="users" className="w-full">
            <UserIcon className="w-4 h-4 mr-2" /> Users
          </TabsTrigger>
          <TabsTrigger value="groups" className="w-full">
            <UsersIcon className="w-4 h-4 mr-2" /> Groups
          </TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-y-auto">
          <TabsContent value="users" className="m-0">
            <div className="space-y-1 p-2">
              {loading && Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              {!loading && onlineUsers.map((user) => (
                <Link href={`/chat/user/${user.userId}`} key={user.userId} onClick={() => handleChatSelection(getChatRoomId(currentUser.userId, user.userId))}>
                  <div
                    className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                      pathname === `/chat/user/${user.userId}`
                        ? 'bg-primary/20 text-primary-foreground'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="relative">
                        <Avatar>
                            <AvatarImage />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                            {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        {user.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-secondary rounded-full" />}
                    </div>
                    <span className="ml-3 font-medium flex-1">{user.name}</span>
                    {unreadMessages[getChatRoomId(currentUser.userId, user.userId)] && <div className="w-3 h-3 bg-accent rounded-full animate-pulse" />}
                  </div>
                </Link>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="groups" className="m-0">
            <div className="space-y-1 p-2">
              {groupChats.map((group) => (
                <Link href={`/chat/group/${group.id}`} key={group.id} onClick={() => handleChatSelection(group.id)}>
                   <div
                    className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                      pathname === `/chat/group/${group.id}`
                        ? 'bg-primary/20 text-primary-foreground'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">#</AvatarFallback>
                    </Avatar>
                    <span className="ml-3 font-medium flex-1">{group.name}</span>
                    {unreadMessages[group.id] && <div className="w-3 h-3 bg-accent rounded-full animate-pulse" />}
                  </div>
                </Link>
              ))}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
