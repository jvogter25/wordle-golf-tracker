-- Fix circular dependency in group_members RLS policies
-- Run this in your Supabase SQL editor

-- Drop ALL existing policies on group_members table
DROP POLICY IF EXISTS "Users can view group members for their groups" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;

-- Create new policies without circular dependencies
CREATE POLICY "Users can view group members for their groups" ON public.group_members
  FOR SELECT USING (
    -- Allow users to see members of groups they belong to
    EXISTS (
      SELECT 1 FROM public.group_members gm2 
      WHERE gm2.group_id = group_members.group_id 
      AND gm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups" ON public.group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups" ON public.group_members
  FOR DELETE USING (user_id = auth.uid());

-- Allow group creators to add themselves as admin without circular dependency
CREATE POLICY "Group creators can add themselves as admin" ON public.group_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    role = 'admin' AND
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id AND created_by = auth.uid()
    )
  );

-- Allow existing admins to manage other members (but not themselves to avoid recursion)
CREATE POLICY "Group admins can manage other members" ON public.group_members
  FOR ALL USING (
    user_id != auth.uid() AND -- Can't manage themselves through this policy
    EXISTS (
      SELECT 1 FROM public.group_members gm2
      WHERE gm2.group_id = group_members.group_id 
      AND gm2.user_id = auth.uid() 
      AND gm2.role = 'admin'
    )
  ); 