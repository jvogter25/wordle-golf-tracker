-- Fix by accepting invite code as parameter from the app
-- Run this in your Supabase SQL editor

CREATE OR REPLACE FUNCTION public.create_group_with_admin(
  group_name text,
  group_description text DEFAULT null,
  invite_code_param text DEFAULT null
)
RETURNS json AS $$
DECLARE
  new_group_id uuid;
  final_invite_code text;
  result json;
BEGIN
  -- Use provided invite code or generate one as fallback
  IF invite_code_param IS NOT NULL AND length(invite_code_param) > 0 THEN
    final_invite_code := upper(invite_code_param);
  ELSE
    -- Fallback generation if not provided
    final_invite_code := upper(substring(encode(gen_random_bytes(4), 'hex'), 1, 6));
  END IF;
  
  -- Create the group
  INSERT INTO public.groups (name, description, created_by, invite_code)
  VALUES (group_name, group_description, auth.uid(), final_invite_code)
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