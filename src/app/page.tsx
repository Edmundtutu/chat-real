'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ref, set } from 'firebase/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';

export default function Home() {
  const [name, setName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('chatUser');
    if (user) {
      router.push('/chat');
    }
  }, [router]);

  const handleJoin = async () => {
    if (name.trim()) {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const user = {
        name: name.trim(),
        userId,
      };

      try {
        await set(ref(db, `users/${userId}`), {
          name: user.name,
          online: true,
        });
        localStorage.setItem('chatUser', JSON.stringify(user));
        router.push('/chat');
      } catch (error) {
        console.error('Failed to set user in Firebase', error);
      }
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center">Welcome to ChatterEd</CardTitle>
          <CardDescription className="text-center pt-2">
            Please enter your name to join the chat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              className="text-center text-lg h-12"
            />
            <Button onClick={handleJoin} className="w-full h-12 text-lg" disabled={!name.trim()}>
              Join Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
