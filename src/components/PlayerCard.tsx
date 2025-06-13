'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Player = Database['public']['Tables']['users']['Row'];

interface PlayerCardProps {
  player: Player;
  onUpdate?: () => void;
}

export default function PlayerCard({ player, onUpdate }: PlayerCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(player.display_name);
  const supabase = createClientComponentClient<Database>();

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ display_name: displayName.trim() })
      .eq('id', player.id);

    if (error) {
      toast.error('Error updating display name');
      return;
    }

    toast.success('Display name updated successfully');
    setIsEditing(false);
    onUpdate?.();
  };

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {isEditing ? (
              <div className="flex gap-2 flex-1">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1"
                />
                <button
                  onClick={handleUpdateDisplayName}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setDisplayName(player.display_name);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <h3 className="text-xl font-semibold">{player.display_name}</h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
          <p className="text-gray-500">{player.email}</p>
        </div>
      </CardContent>
    </Card>
  );
} 