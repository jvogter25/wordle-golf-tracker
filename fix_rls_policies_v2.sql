-- Complete fix for group_members RLS circular dependency
-- Run this in your Supabase SQL editor

-- Drop ALL existing policies on group_members table
DROP POLICY IF EXISTS "Users can view group members for their groups" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
DROP POLICY IF EXISTS "Group creators can add themselves as admin" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can manage other members" ON public.group_members;

-- Create much simpler policies without ANY circular dependencies

-- 1. Allow users to see group members only for groups they created OR groups where they're already a member
-- This uses the GROUPS table to check ownership, avoiding circular dependency
CREATE POLICY "Users can view group members" ON public.group_members
  FOR SELECT USING (
    -- Can see members if they created the group
    group_id IN (SELECT id FROM public.groups WHERE created_by = auth.uid())
    OR
    -- Can see members if they are a member (but use direct user_id check, not subquery)
    user_id = auth.uid()
  );

-- 2. Allow users to insert themselves into any group (group admins can control this at app level)
CREATE POLICY "Users can add themselves to groups" ON public.group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. Allow users to remove themselves from groups
CREATE POLICY "Users can remove themselves from groups" ON public.group_members
  FOR DELETE USING (user_id = auth.uid());

-- 4. Allow group creators to manage all members of their groups
CREATE POLICY "Group creators can manage all members" ON public.group_members
  FOR ALL USING (
    group_id IN (SELECT id FROM public.groups WHERE created_by = auth.uid())
  ); 