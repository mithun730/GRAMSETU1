-- ============================================================================
-- GRAM SETU (గ్రామ సేతు) - PRODUCTION DATABASE SCHEMA & RLS POLICIES
-- Target: Supabase PostgreSQL Engine (Multi-Panchayat Architecture)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES & ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('villager', 'authority', 'admin', 'panchayat_authority', 'administrator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE fund_status AS ENUM ('sanctioned', 'received', 'partially_utilized', 'fully_utilized');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('proposed', 'approved', 'in_progress', 'completed', 'on_hold', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE complaint_status AS ENUM ('pending', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE question_status AS ENUM ('submitted', 'under_review', 'answered', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE expenditure_status AS ENUM ('pending_approval', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. CORE ENTITIES & TABLES
-- ============================================================================

-- 3.1 ROLES TABLE (System Role Definitions & RBAC Directory)
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key VARCHAR(50) UNIQUE NOT NULL, -- 'villager', 'panchayat_authority', 'administrator'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed System Roles if not already present
INSERT INTO public.roles (role_key, name, description)
VALUES 
    ('villager', 'Villager / Citizen', 'Standard resident citizen access with rights to submit grievances, questions, and view public financial ledgers'),
    ('panchayat_authority', 'Panchayat Authority', 'Elected Sarpanch, Ward Members, Panchayat Secretary, and departmental staff with management privileges for their Panchayat'),
    ('administrator', 'System Administrator', 'State / District / Platform administrator with global access across all Panchayats, role management, and audit inspection')
ON CONFLICT (role_key) DO NOTHING;

-- 3.2 PANCHAYATS TABLE (Multi-Panchayat Master Directory)
CREATE TABLE IF NOT EXISTS public.panchayats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_te VARCHAR(255),
    mandal VARCHAR(255) NOT NULL,
    district VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL DEFAULT 'Telangana',
    country VARCHAR(255) NOT NULL DEFAULT 'India',
    pin_code VARCHAR(10) NOT NULL,
    lgd_code VARCHAR(50), -- Local Government Directory Code
    sarpanch_name VARCHAR(255),
    sarpanch_phone VARCHAR(20),
    secretary_name VARCHAR(255),
    secretary_phone VARCHAR(20),
    office_address TEXT,
    contact_email VARCHAR(255),
    population INT DEFAULT 0 CHECK (population >= 0),
    total_wards INT DEFAULT 1 CHECK (total_wards > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 USER PROFILES TABLE (Linked directly to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'villager',
    panchayat_id UUID REFERENCES public.panchayats(id) ON DELETE SET NULL,
    ward_number INT,
    house_number VARCHAR(100),
    designation VARCHAR(150), -- 'Sarpanch', 'Panchayat Secretary', 'Ward Member', etc.
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 FUNDS TABLE (Grants, Central/State Schemes, Own Revenue)
CREATE TABLE IF NOT EXISTS public.funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panchayat_id UUID NOT NULL REFERENCES public.panchayats(id) ON DELETE CASCADE,
    funding_source VARCHAR(255) NOT NULL, -- e.g., '15th Finance Commission', 'State Finance Grant', 'MGNREGS'
    scheme_name VARCHAR(255) NOT NULL,
    financial_year VARCHAR(20) NOT NULL, -- e.g., '2025-2026'
    reference_number VARCHAR(100) NOT NULL,
    sanctioned_amount NUMERIC(15, 2) NOT NULL CHECK (sanctioned_amount >= 0),
    received_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (received_amount >= 0),
    date_sanctioned DATE,
    date_received DATE,
    purpose TEXT NOT NULL,
    supporting_document_url TEXT,
    status fund_status DEFAULT 'sanctioned',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_fund_ref_panchayat UNIQUE (panchayat_id, reference_number)
);

-- 3.5 PROJECTS TABLE (Village Infrastructure & Development Works)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panchayat_id UUID NOT NULL REFERENCES public.panchayats(id) ON DELETE CASCADE,
    fund_id UUID REFERENCES public.funds(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    name_te VARCHAR(255),
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'Drinking Water', 'Roads & Drains', 'Sanitation', 'Street Lighting', 'Community Hall'
    location VARCHAR(255) NOT NULL,
    ward_number INT,
    estimated_cost NUMERIC(15, 2) NOT NULL CHECK (estimated_cost >= 0),
    approved_amount NUMERIC(15, 2) NOT NULL CHECK (approved_amount >= 0),
    amount_spent NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (amount_spent >= 0),
    start_date DATE,
    expected_completion_date DATE,
    actual_completion_date DATE,
    status project_status DEFAULT 'proposed',
    progress_percentage INT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    contractor_name VARCHAR(255),
    before_photos TEXT[] DEFAULT '{}',
    after_photos TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 EXPENDITURES TABLE (Transparent Itemized Public Ledger)
CREATE TABLE IF NOT EXISTS public.expenditures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panchayat_id UUID NOT NULL REFERENCES public.panchayats(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    fund_id UUID REFERENCES public.funds(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Material Purchase', 'Labor Wages', 'Equipment Rental', 'Maintenance'
    description TEXT NOT NULL,
    vendor_name VARCHAR(255),
    bill_number VARCHAR(100),
    bill_document_url TEXT,
    payment_mode VARCHAR(100) DEFAULT 'Direct Treasury Transfer',
    approval_status expenditure_status DEFAULT 'approved',
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.7 COMPLAINTS TABLE (Citizen Grievance Redressal System)
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number VARCHAR(50) NOT NULL UNIQUE,
    panchayat_id UUID NOT NULL REFERENCES public.panchayats(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    citizen_name VARCHAR(255) NOT NULL,
    citizen_phone VARCHAR(20),
    ward_number INT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Water Supply', 'Sanitation & Garbage', 'Street Light', 'Road Repair', 'Drainage'
    location VARCHAR(255) NOT NULL,
    attachment_urls TEXT[] DEFAULT '{}',
    status complaint_status DEFAULT 'pending',
    priority complaint_priority DEFAULT 'medium',
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8 QUESTIONS TABLE (Praja Prashnalu - Citizen Public Inquiries)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number VARCHAR(50) NOT NULL UNIQUE,
    panchayat_id UUID NOT NULL REFERENCES public.panchayats(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    citizen_name VARCHAR(255) NOT NULL,
    ward_number INT,
    subject VARCHAR(255) NOT NULL,
    question_text TEXT NOT NULL,
    status question_status DEFAULT 'submitted',
    authority_response TEXT,
    responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    responded_at TIMESTAMPTZ,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9 DOCUMENTS TABLE (Official Gram Sabha Resolutions, Budgets & Audits)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panchayat_id UUID NOT NULL REFERENCES public.panchayats(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Gram Sabha Resolution', 'Annual Budget', 'Audit Report', 'Citizen Charter'
    document_number VARCHAR(100),
    issue_date DATE,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    is_public BOOLEAN DEFAULT TRUE,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.10 ANNOUNCEMENTS TABLE (Official Alerts & Notices)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panchayat_id UUID NOT NULL REFERENCES public.panchayats(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    title_te VARCHAR(255),
    content TEXT NOT NULL,
    content_te TEXT,
    category VARCHAR(100) DEFAULT 'General', -- 'Gram Sabha', 'Drinking Water Schedule', 'Sanitation & Health'
    is_active BOOLEAN DEFAULT TRUE,
    priority VARCHAR(50) DEFAULT 'normal', -- 'normal', 'high', 'urgent'
    valid_until DATE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.11 NOTIFICATIONS TABLE (In-App Citizen and Staff Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    panchayat_id UUID REFERENCES public.panchayats(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    type VARCHAR(50) DEFAULT 'info', -- 'complaint_update', 'question_answered', 'announcement', 'system'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.12 AUDIT LOGS TABLE (Immutable Governance & Security Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panchayat_id UUID REFERENCES public.panchayats(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- 'CREATE_FUND', 'UPDATE_PROJECT', 'RESOLVE_COMPLAINT', 'UPLOAD_EXPENDITURE'
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. PERFORMANCE & MULTI-TENANCY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_panchayats_district_mandal ON public.panchayats(district, mandal);
CREATE INDEX IF NOT EXISTS idx_profiles_panchayat_role ON public.profiles(panchayat_id, role);
CREATE INDEX IF NOT EXISTS idx_funds_panchayat_year ON public.funds(panchayat_id, financial_year);
CREATE INDEX IF NOT EXISTS idx_projects_panchayat_status ON public.projects(panchayat_id, status);
CREATE INDEX IF NOT EXISTS idx_expenditures_panchayat_proj ON public.expenditures(panchayat_id, project_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_complaints_panchayat_citizen ON public.complaints(panchayat_id, citizen_id, status);
CREATE INDEX IF NOT EXISTS idx_questions_panchayat_public ON public.questions(panchayat_id, is_public, status);
CREATE INDEX IF NOT EXISTS idx_documents_panchayat_public ON public.documents(panchayat_id, is_public, category);
CREATE INDEX IF NOT EXISTS idx_announcements_panchayat_active ON public.announcements(panchayat_id, is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_panchayat_time ON public.audit_logs(panchayat_id, created_at DESC);

-- ============================================================================
-- 5. BUSINESS LOGIC SEQUENCES & TRIGGERS
-- ============================================================================

-- A. Auto Reference Number Sequences
CREATE SEQUENCE IF NOT EXISTS complaint_ref_seq START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS question_ref_seq START WITH 1001;

CREATE OR REPLACE FUNCTION generate_complaint_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
        NEW.reference_number := 'CMP-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('complaint_ref_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_complaint_ref ON public.complaints;
CREATE TRIGGER trg_generate_complaint_ref
BEFORE INSERT ON public.complaints
FOR EACH ROW EXECUTE FUNCTION generate_complaint_reference();

CREATE OR REPLACE FUNCTION generate_question_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
        NEW.reference_number := 'QST-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('question_ref_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_question_ref ON public.questions;
CREATE TRIGGER trg_generate_question_ref
BEFORE INSERT ON public.questions
FOR EACH ROW EXECUTE FUNCTION generate_question_reference();

-- B. Project Spent Amount Synchronization
CREATE OR REPLACE FUNCTION update_project_spent_amount()
RETURNS TRIGGER AS $$
DECLARE
    target_project_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_project_id := OLD.project_id;
    ELSE
        target_project_id := NEW.project_id;
    END IF;

    IF target_project_id IS NOT NULL THEN
        UPDATE public.projects
        SET amount_spent = COALESCE((
            SELECT SUM(amount)
            FROM public.expenditures
            WHERE project_id = target_project_id AND approval_status = 'approved'
        ), 0),
        updated_at = NOW()
        WHERE id = target_project_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_project_spent ON public.expenditures;
CREATE TRIGGER trg_update_project_spent
AFTER INSERT OR UPDATE OR DELETE ON public.expenditures
FOR EACH ROW EXECUTE FUNCTION update_project_spent_amount();

-- C. Auth User Signup Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_panchayat_id UUID;
    user_role_val user_role;
    user_name TEXT;
    user_phone TEXT;
    user_ward INT;
BEGIN
    SELECT id INTO default_panchayat_id FROM public.panchayats ORDER BY created_at ASC LIMIT 1;
    
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    user_phone := NEW.raw_user_meta_data->>'phone';
    
    IF NEW.raw_user_meta_data->>'role' IN ('admin', 'administrator') THEN
        user_role_val := 'admin';
    ELSIF NEW.raw_user_meta_data->>'role' IN ('authority', 'panchayat_authority') THEN
        user_role_val := 'authority';
    ELSE
        user_role_val := 'villager';
    END IF;

    IF NEW.raw_user_meta_data->>'ward_number' IS NOT NULL THEN
        user_ward := (NEW.raw_user_meta_data->>'ward_number')::INT;
    ELSE
        user_ward := 1;
    END IF;

    INSERT INTO public.profiles (id, full_name, phone, role, panchayat_id, ward_number, created_at, updated_at)
    VALUES (
        NEW.id,
        user_name,
        user_phone,
        user_role_val,
        COALESCE((NEW.raw_user_meta_data->>'panchayat_id')::UUID, default_panchayat_id),
        user_ward,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 6. RBAC SECURITY HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_panchayat_id()
RETURNS UUID AS $$
    SELECT panchayat_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'administrator')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_authority_or_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'authority' OR role = 'panchayat_authority' OR role = 'admin' OR role = 'administrator')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_panchayat_authority(target_panchayat_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (
            role = 'admin' OR role = 'administrator'
            OR ((role = 'authority' OR role = 'panchayat_authority') AND (panchayat_id = target_panchayat_id OR target_panchayat_id IS NULL))
        )
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panchayats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenditures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 7.1 Roles Policies
CREATE POLICY "Public read for roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Admin manage roles" ON public.roles FOR ALL USING (public.is_admin());

-- 7.2 Panchayats Policies
CREATE POLICY "Public read for panchayats" ON public.panchayats FOR SELECT USING (true);
CREATE POLICY "Authority and Admin manage panchayats" ON public.panchayats FOR ALL USING (public.is_authority_or_admin());

-- 7.3 Profiles Policies
CREATE POLICY "Public read for member profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin full manage profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- 7.4 Funds Policies
CREATE POLICY "Public read for funds" ON public.funds FOR SELECT USING (true);
CREATE POLICY "Authority insert funds" ON public.funds FOR INSERT WITH CHECK (public.is_panchayat_authority(panchayat_id));
CREATE POLICY "Authority update funds" ON public.funds FOR UPDATE USING (public.is_panchayat_authority(panchayat_id));
CREATE POLICY "Admin delete funds" ON public.funds FOR DELETE USING (public.is_admin());

-- 7.5 Projects Policies
CREATE POLICY "Public read for projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Authority insert projects" ON public.projects FOR INSERT WITH CHECK (public.is_panchayat_authority(panchayat_id));
CREATE POLICY "Authority update projects" ON public.projects FOR UPDATE USING (public.is_panchayat_authority(panchayat_id));
CREATE POLICY "Admin delete projects" ON public.projects FOR DELETE USING (public.is_admin());

-- 7.6 Expenditures Policies
CREATE POLICY "Public read for approved expenditures" ON public.expenditures FOR SELECT USING (true);
CREATE POLICY "Authority insert expenditures" ON public.expenditures FOR INSERT WITH CHECK (public.is_panchayat_authority(panchayat_id));
CREATE POLICY "Authority update expenditures" ON public.expenditures FOR UPDATE USING (public.is_panchayat_authority(panchayat_id));
CREATE POLICY "Admin delete expenditures" ON public.expenditures FOR DELETE USING (public.is_admin());

-- 7.7 Complaints Policies
CREATE POLICY "Citizens read own complaints or authorities read panchayat complaints" ON public.complaints
    FOR SELECT USING (
        auth.uid() = citizen_id OR public.is_panchayat_authority(panchayat_id)
    );

CREATE POLICY "Citizens insert own complaints" ON public.complaints
    FOR INSERT WITH CHECK (auth.uid() = citizen_id);

CREATE POLICY "Authorities and Admins update complaints" ON public.complaints
    FOR UPDATE USING (public.is_panchayat_authority(panchayat_id));

-- 7.8 Questions Policies
CREATE POLICY "Public read answered questions or citizen read own" ON public.questions
    FOR SELECT USING (
        is_public = true OR auth.uid() = citizen_id OR public.is_panchayat_authority(panchayat_id)
    );

CREATE POLICY "Citizens insert own questions" ON public.questions
    FOR INSERT WITH CHECK (auth.uid() = citizen_id);

CREATE POLICY "Authorities and Admins answer questions" ON public.questions
    FOR UPDATE USING (public.is_panchayat_authority(panchayat_id));

-- 7.9 Documents Policies
CREATE POLICY "Public read public documents" ON public.documents
    FOR SELECT USING (is_public = true OR public.is_panchayat_authority(panchayat_id));

CREATE POLICY "Authority manage documents" ON public.documents
    FOR ALL USING (public.is_panchayat_authority(panchayat_id));

-- 7.10 Announcements Policies
CREATE POLICY "Public read announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Authority manage announcements" ON public.announcements FOR ALL USING (public.is_panchayat_authority(panchayat_id));

-- 7.11 Notifications Policies
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System and Authorities insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- 7.12 Audit Logs Policies
CREATE POLICY "Authorities and Admins read audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_authority_or_admin());

CREATE POLICY "Authenticated users insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 8. SUPABASE STORAGE BUCKETS & POLICIES
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('panchayat-documents', 'panchayat-documents', true),
    ('complaint-attachments', 'complaint-attachments', true),
    ('expenditure-bills', 'expenditure-bills', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read for panchayat documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'panchayat-documents');

CREATE POLICY "Authority upload for panchayat documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'panchayat-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authority manage for panchayat documents" ON storage.objects
    FOR ALL USING (bucket_id = 'panchayat-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Public read for complaint attachments" ON storage.objects
    FOR SELECT USING (bucket_id = 'complaint-attachments');

CREATE POLICY "Citizen upload complaint attachments" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'complaint-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Public read for expenditure bills" ON storage.objects
    FOR SELECT USING (bucket_id = 'expenditure-bills');

CREATE POLICY "Authority upload expenditure bills" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'expenditure-bills' AND auth.role() = 'authenticated');
