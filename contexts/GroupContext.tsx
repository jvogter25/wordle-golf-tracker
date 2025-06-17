"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserGroups } from '../lib/groups';

interface Group {
  id: string;
  name: string;
  description?: string;
  invite_code?: string;
  created_at: string;
}

interface GroupContextType {
  selectedGroup: Group | null;
  availableGroups: Group[];
  setSelectedGroup: (group: Group) => void;
  loading: boolean;
  refreshGroups: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: ReactNode }) {
  const { user, supabase } = useAuth();
  const [selectedGroup, setSelectedGroupState] = useState<Group | null>(null);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Load groups when user changes
  useEffect(() => {
    if (user) {
      loadGroups();
    } else {
      setSelectedGroupState(null);
      setAvailableGroups([]);
      setLoading(false);
    }
  }, [user]);

  // Load selected group from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGroupId = localStorage.getItem('selectedGroupId');
      if (savedGroupId && availableGroups.length > 0) {
        const savedGroup = availableGroups.find(g => g.id === savedGroupId);
        if (savedGroup) {
          setSelectedGroupState(savedGroup);
        }
      }
    }
  }, [availableGroups]);

  const loadGroups = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      const groupsData = await getUserGroups(supabase);
      // Flatten and type the groups properly
      const groups: Group[] = (groupsData as any[])
        .filter(item => item && typeof item === 'object')
        .map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          invite_code: item.invite_code,
          created_at: item.created_at
        }))
        .filter(group => group.id && group.name);
      
      setAvailableGroups(groups);
      
      // If no group selected and user has groups, select the first one
      if (!selectedGroup && groups.length > 0) {
        const firstGroup = groups[0];
        setSelectedGroupState(firstGroup);
        localStorage.setItem('selectedGroupId', firstGroup.id);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      setAvailableGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const setSelectedGroup = (group: Group) => {
    setSelectedGroupState(group);
    localStorage.setItem('selectedGroupId', group.id);
  };

  const refreshGroups = async () => {
    await loadGroups();
  };

  return (
    <GroupContext.Provider value={{
      selectedGroup,
      availableGroups,
      setSelectedGroup,
      loading,
      refreshGroups
    }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
} 