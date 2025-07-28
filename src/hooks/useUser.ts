'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  name: string;
  userId: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userJson = localStorage.getItem('chatUser');
    if (userJson) {
      setUser(JSON.parse(userJson));
    } else {
      router.push('/');
    }
    setLoading(false);
  }, [router]);

  return { user, loading };
}
