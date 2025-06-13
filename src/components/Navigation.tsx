'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export default function Navigation() {
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(session?.user.email === 'jakevogt25@gmail.com');
    };

    checkAdmin();
  }, [supabase]);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-green-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className={`text-lg font-semibold hover:text-green-200 ${
                isActive('/') ? 'text-green-200' : ''
              }`}
            >
              Wordle Golf
            </Link>
            <Link
              href="/clubhouse"
              className={`hover:text-green-200 ${
                isActive('/clubhouse') ? 'text-green-200' : ''
              }`}
            >
              Clubhouse
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className={`hover:text-green-200 ${
                  isActive('/admin') ? 'text-green-200' : ''
                }`}
              >
                Admin Center
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 