'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function DeleteUser() {
  const [email, setEmail] = useState('');
  const supabase = createClientComponentClient<Database>();

  const deleteUser = async () => {
    if (!email) {
      toast.error('Please enter an email');
      return;
    }

    // First delete from users table
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('email', email);

    if (userError) {
      toast.error('Error deleting user from users table');
      return;
    }

    // Then delete from auth.users
    const { error: authError } = await supabase.auth.admin.deleteUser(
      email
    );

    if (authError) {
      toast.error('Error deleting user from auth');
      return;
    }

    toast.success('User deleted successfully');
    setEmail('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Delete User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter email to delete"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={deleteUser} variant="destructive">
              Delete User
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 