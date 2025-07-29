'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, serverTimestamp, set, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { User } from '@/hooks/useUser';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SendHorizonal, User as UserIcon, Users, Paperclip, Mic, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';

interface Message {
  id: string;
  text?: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  type: 'text' | 'image' | 'video' | 'audio';
  url?: string;
  fileName?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

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

  const handleSendMessage = (text: string) => {
    if (text.trim()) {
      const messagesRef = ref(db, `chats/${chatRoomId}/messages`);
      push(messagesRef, {
        text: text,
        senderId: currentUser.userId,
        senderName: currentUser.name,
        timestamp: serverTimestamp(),
        type: 'text',
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("File size should be less than 20MB.");
        return;
      }
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if(event.lengthComputable) {
            const percentage = (event.loaded / event.total) * 100;
            setUploadProgress(percentage);
        }
      }
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
        if (type === 'image' || type === 'video') {
            sendMediaMessage(url, type, file.name);
        }
        setUploadProgress(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMediaMessage = (url: string, type: 'image' | 'video' | 'audio', fileName: string) => {
    const messagesRef = ref(db, `chats/${chatRoomId}/messages`);
    push(messagesRef, {
      senderId: currentUser.userId,
      senderName: currentUser.name,
      timestamp: serverTimestamp(),
      type,
      url,
      fileName,
    });
  };

  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const reader = new FileReader();
          reader.onload = (e) => {
            const url = e.target?.result as string;
            sendMediaMessage(url, 'audio', `audio-message-${Date.now()}.wav`);
          };
          reader.readAsDataURL(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error recording audio: ", err);
        alert("Could not start recording. Please ensure microphone permissions are granted.");
      }
    }
  };


  const renderMessageContent = (message: Message) => {
    switch (message.type) {
      case 'image':
        return <img src={message.url} alt={message.fileName || 'sent image'} className="max-w-xs md:max-w-md rounded-lg" />;
      case 'video':
        return <video src={message.url} controls className="max-w-xs md:max-w-md rounded-lg" />;
      case 'audio':
        return <audio src={message.url} controls className="w-full" />;
      case 'text':
      default:
        return <p className="text-base">{message.text}</p>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-secondary/50 rounded-l-lg">
      <header className="flex items-center p-4 border-b bg-card shadow-sm">
         <div className="flex items-center space-x-3">
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
              {renderMessageContent(message)}
              <p className="text-xs opacity-70 mt-1 text-right">
                {message.timestamp ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true }) : 'sending...'}
              </p>
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
       {uploadProgress !== null && (
          <div className="p-4">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-center mt-1">Uploading file...</p>
          </div>
        )}

      {isRecording && (
        <div className="p-4 border-t bg-card flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <p className="text-sm font-medium text-red-500">Recording audio...</p>
            </div>
            <Button onClick={handleRecord} variant="destructive" size="icon"><X className="w-4 h-4"/></Button>
        </div>
      )}
      <div className="p-4 border-t bg-card">
        <div className="relative flex items-center space-x-2">
          <Textarea
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(newMessage);
              }
            }}
            placeholder="Type a message..."
            className="pr-20 min-h-[50px] resize-none"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex space-x-1">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isRecording}>
                <Paperclip className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRecord} className={isRecording ? 'text-red-500' : ''}>
                <Mic className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => handleSendMessage(newMessage)}
              className="h-9 w-14"
              disabled={!newMessage.trim()}
            >
              <SendHorizonal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
