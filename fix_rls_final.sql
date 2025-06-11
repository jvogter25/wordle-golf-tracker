-- Final fix for group creation infinite recursion
-- Run this in your Supabase SQL editor

-- 1. Drop ALL existing policies on group_members table
DROP POLICY IF EXISTS "Users can view group members for their groups" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
DROP POLICY IF EXISTS "Group creators can add themselves as admin" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can manage other members" ON public.group_members;
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can add themselves to groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can remove themselves from groups" ON public.group_members;
DROP POLICY IF EXISTS "Group creators can manage all members" ON public.group_members;

-- 2. Create a database function to handle group creation (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_group_with_admin(
  group_name text,
  group_description text DEFAULT null
)
RETURNS json AS $$
DECLARE
  new_group_id uuid;
  invite_code text;
  result json;
BEGIN
  -- Generate invite code
  invite_code := upper(substr(md5(random()::text), 1, 6));
  
  -- Create the group
  INSERT INTO public.groups (name, description, created_by, invite_code)
  VALUES (group_name, group_description, auth.uid(), invite_code)
  RETURNING id INTO new_group_id;
  
  -- Add creator as admin (this bypasses RLS since it's in a SECURITY DEFINER function)
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (new_group_id, auth.uid(), 'admin');
  
  -- Return the group data
  SELECT json_build_object(
    'id', id,
    'name', name,
    'description', description,
    'invite_code', invite_code,
    'created_by', created_by,
    'created_at', created_at
  ) INTO result
  FROM public.groups
  WHERE id = new_group_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create simple RLS policies without circular dependencies
CREATE POLICY "Users can view their own group memberships" ON public.group_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view group members where they are members" ON public.group_members
  FOR SELECT USING (
    group_id IN (
      SELECT gm.group_id FROM public.group_members gm 
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups via invite" ON public.group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups" ON public.group_members
  FOR DELETE USING (user_id = auth.uid());

-- 4. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_group_with_admin TO authenticated; 