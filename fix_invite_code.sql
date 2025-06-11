-- Fix the invite code generation in the database function
-- Run this in your Supabase SQL editor

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
  -- Generate invite code using a more reliable method
  invite_code := upper(substring(encode(gen_random_bytes(4), 'hex'), 1, 6));
  
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