'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, serverTimestamp, set, remove, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { User } from '@/hooks/useUser';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SendHorizonal, User as UserIcon, Users, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

interface TypingStatus {
    [userId: string]: boolean | { name: string };
}

export function ChatView({ chatRoomId, currentUser, chatPartner, isGroupChat }: { chatRoomId: string; currentUser: User, chatPartner: { id: string, name: string }, isGroupChat: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const messagesRef = ref(db, `chats/${chatRoomId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messagesData: Message[] = [];
      snapshot.forEach((childSnapshot) => {
        messagesData.push({ id: childSnapshot.key!, ...childSnapshot.val() });
      });
      setMessages(messagesData);
    });
    return () => unsubscribe();
  }, [chatRoomId]);

  useEffect(() => {
    const typingRef = ref(db, `chats/${chatRoomId}/typing`);
    const unsubscribe = onValue(typingRef, (snapshot) => {
        const data = snapshot.val() || {};
        const currentTypingUsers = Object.entries(data)
            .filter(([key, value]) => key !== currentUser.userId && value)
            .map(([key, value]) => (value as { name: string }).name);
        setTypingUsers(currentTypingUsers);
    });
    return () => unsubscribe();
  }, [chatRoomId, currentUser.userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const messagesRef = ref(db, `chats/${chatRoomId}/messages`);
      push(messagesRef, {
        text: newMessage,
        senderId: currentUser.userId,
        senderName: currentUser.name,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
      const userTypingRef = ref(db, `chats/${chatRoomId}/typing/${currentUser.userId}`);
      remove(userTypingRef);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    const userTypingRef = ref(db, `chats/${chatRoomId}/typing/${currentUser.userId}`);
    set(userTypingRef, { name: currentUser.name });

    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
        remove(userTypingRef);
    }, 2000);
  }

  const getTypingText = () => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    return 'Several people are typing...';
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-secondary/50 lg:rounded-l-lg">
      <header className="flex items-center p-4 border-b bg-card shadow-sm">
         <div className="flex items-center space-x-3">
            <Link href="/chat" className="lg:hidden mr-2">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
            </Link>
             <Avatar>
                 <AvatarFallback className="bg-primary text-primary-foreground">
                    {isGroupChat ? <Users className="w-5 h-5"/> : <UserIcon className="w-5 h-5"/>}
                 </AvatarFallback>
             </Avatar>
             <h2 className="text-xl font-semibold font-headline">{chatPartner.name}</h2>
         </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-end gap-2 ${message.senderId === currentUser.userId ? 'justify-end' : ''}`}
          >
            {message.senderId !== currentUser.userId && (
                <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-sm bg-muted-foreground text-white">{message.senderName.charAt(0)}</AvatarFallback>
                </Avatar>
            )}
            <div
              className={`flex flex-col max-w-xs md:max-w-md lg:max-w-2xl rounded-2xl px-4 py-2 ${
                message.senderId === currentUser.userId
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-card text-card-foreground rounded-bl-none shadow-sm'
              }`}
            >
              {isGroupChat && message.senderId !== currentUser.userId && (
                 <p className="text-xs font-semibold text-accent pb-1">{message.senderName}</p>
              )}
              <p className="text-base">{message.text}</p>
              <span className="text-xs opacity-70 mt-1 self-end">
                {message.timestamp ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true }) : 'sending...'}
              </span>
            </div>
            {message.senderId === currentUser.userId && (
                <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-sm bg-accent text-accent-foreground">{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
            )}
          </div>
        ))}
         {typingUsers.length > 0 && (
             <div className="flex items-end gap-2">
                 <div className="flex flex-col max-w-xs rounded-lg px-4 py-2">
                     <p className="text-sm text-muted-foreground animate-pulse">{getTypingText()}</p>
                 </div>
             </div>
         )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t bg-card">
        <div className="relative">
          <Textarea
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="pr-20 min-h-[50px] resize-none"
          />
          <Button
            onClick={handleSendMessage}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-9 w-14"
            disabled={!newMessage.trim()}
          >
            <SendHorizonal className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
