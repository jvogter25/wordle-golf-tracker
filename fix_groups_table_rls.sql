-- Fix RLS policies on BOTH groups and group_members tables
-- Run this in your Supabase SQL editor

-- 1. Drop all policies on group_members (we already did this but just to be sure)
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

-- 2. Drop all policies on groups table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'groups' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.groups', pol.policyname);
    END LOOP;
END $$;

-- 3. Disable RLS on both tables entirely
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;

-- 4. Create the database function to handle group creation
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
  
  -- Add creator as admin
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

-- 5. Other database functions
CREATE OR REPLACE FUNCTION public.join_group_by_code(
  invite_code_param text
)
RETURNS json AS $$
DECLARE
  group_record RECORD;
  existing_member_count integer;
  result json;
BEGIN
  -- Find group by invite code
  SELECT * INTO group_record
  FROM public.groups
  WHERE invite_code = upper(invite_code_param);
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;
  
  -- Check if already a member
  SELECT COUNT(*) INTO existing_member_count
  FROM public.group_members
  WHERE group_id = group_record.id AND user_id = auth.uid();
  
  IF existing_member_count > 0 THEN
    RAISE EXCEPTION 'Already a member of this group';
  END IF;
  
  -- Add as member
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (group_record.id, auth.uid(), 'member');
  
  -- Return group data
  SELECT json_build_object(
    'id', group_record.id,
    'name', group_record.name,
    'description', group_record.description,
    'invite_code', group_record.invite_code,
    'created_by', group_record.created_by,
    'created_at', group_record.created_at
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_groups()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', g.id,
      'name', g.name,
      'description', g.description,
      'invite_code', g.invite_code,
      'created_at', g.created_at,
      'role', gm.role,
      'joined_at', gm.joined_at
    )
  ) INTO result
  FROM public.group_members gm
  JOIN public.groups g ON gm.group_id = g.id
  WHERE gm.user_id = auth.uid();
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_group_members(
  group_id_param uuid
)
RETURNS json AS $$
DECLARE
  user_is_member boolean;
  result json;
BEGIN
  -- Check if current user is a member of this group
  SELECT EXISTS(
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_id_param AND user_id = auth.uid()
  ) INTO user_is_member;
  
  IF NOT user_is_member THEN
    RAISE EXCEPTION 'Not authorized to view members of this group';
  END IF;
  
  -- Return members with profile data
  SELECT json_agg(
    json_build_object(
      'id', p.id,
      'email', p.email,
      'display_name', p.display_name,
      'avatar_url', p.avatar_url,
      'role', gm.role,
      'joined_at', gm.joined_at
    )
  ) INTO result
  FROM public.group_members gm
  JOIN public.profiles p ON gm.user_id = p.id
  WHERE gm.group_id = group_id_param;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.leave_group(
  group_id_param uuid
)
RETURNS boolean AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.group_members
  WHERE group_id = group_id_param AND user_id = auth.uid();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION public.create_group_with_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_by_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_groups TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_members TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_group TO authenticated; 