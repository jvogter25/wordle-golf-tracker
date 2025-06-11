-- NUCLEAR OPTION: Drop ALL policies on group_members and start fresh
-- Run this in your Supabase SQL editor

-- 1. Drop ALL policies on group_members table (query system tables to get exact names)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'group_members' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.group_members', pol.policyname);
    END LOOP;
END $$;

-- 2. Disable RLS temporarily to ensure clean slate
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;

-- 3. Re-enable RLS
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- 4. Create the database function to handle group creation (bypasses RLS)
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

-- 5. Create simple RLS policies without circular dependencies
CREATE POLICY "view_own_memberships" ON public.group_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "view_group_members_if_member" ON public.group_members
  FOR SELECT USING (
    group_id IN (
      SELECT gm.group_id FROM public.group_members gm 
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "join_groups" ON public.group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "leave_groups" ON public.group_members
  FOR DELETE USING (user_id = auth.uid());

-- 6. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_group_with_admin TO authenticated; 