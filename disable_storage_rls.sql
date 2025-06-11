-- Nuclear option: Disable RLS on storage entirely
-- Run this ONLY if the other approach doesn't work

-- Disable RLS on storage objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY; 