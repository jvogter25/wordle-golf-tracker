-- Fix RLS on scores and handicaps tables too
-- Run this in your Supabase SQL editor

-- Drop all policies on scores table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'scores' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.scores', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on handicaps table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'handicaps' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.handicaps', pol.policyname);
    END LOOP;
END $$;

-- Disable RLS on scores and handicaps tables
ALTER TABLE public.scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.handicaps DISABLE ROW LEVEL SECURITY; 