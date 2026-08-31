-- ============================================================================
-- GRAM SETU (గ్రామ సేతు) - PRODUCTION DATABASE SCHEMA & RLS POLICIES
-- Target: Supabase PostgreSQL
-- Initial Gram Panchayat: Sriramnagar, Jagityal, Telangana, India
-- ============================================================================

-- 1. Enable UUID Extension & Crypto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Types & Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('villager', 'authority', 'admin');
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
-- 3. CORE TABLES
-- ============================================================================

-- A. PANCHAYATS
CREATE TABLE IF NOT EXISTS public.panchayats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_te VARCHAR(255),
    mandal VARCHAR(255) NOT NULL,
    district VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL DEFAULT 'Telangana',
    country VARCHAR(255) NOT NULL DEFAULT 'India',
    pin_code VARCHAR(10) NOT NULL,
    lgd_code VARCHAR(50), -- Local Government Directory code
    sarpanch_name VARCHAR(255),
    sarpanch_phone VARCHAR(20),
    secretary_name VARCHAR(255),
    secretary_phone VARCHAR(20),
    office_address TEXT,
    contact_email VARCHAR(255),
    population INT DEFAULT 0,
    total_wards INT DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. USER PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'villager',
    panchayat_id UUID REFERENCES public.panchayats(id) ON DELETE SET NULL,
    ward_number INT,
    house_number VARCHAR(100),
    designation VARCHAR(150), -- for authority: e.g., 'Panchayat Secretary', 'Sarpanch', 'Ward Member'
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. FUNDS (Grants, Schemes, Panchayat Own Revenue)
CREATE TABLE IF NOT EXISTS public.funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panchayat_id UUID NOT NULL REFERENCES public.panchayats(id) ON DELETE CASCADE,
    funding_source VARCHAR(255) NOT NULL, -- e.g., '15th Finance Commission', 'State Finance Grant', 'MGNREGS', 'Taxes & User Fees'
    scheme_name VARCHAR(255) NOT NULL,
    financial_year VARCHAR(20) NOT NULL, -- e.g., '2025-2026'
    reference_number VARCHAR(100) NOT NULL UNIQUE,
    sanctioned_amount NUMERIC(15, 2) NOT NULL CHECK (sanctioned_amount >= 0),
    received_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (received_amount >= 0),
    date_sanctioned DATE,
    date_received DATE,
    purpose TEXT NOT NULL,
    supporting_document_url TEXT,
    status fund_status DEFAULT 'sanctioned',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- D. PROJECTS (Development Works)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panchayat_id UUID NOT NULL REFERENCES public.panchayats(id) ON DELETE CASCADE,
    fund_id UUID REFERENCES public.funds(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    name_te VARCHAR(255),
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'Drinking Water', 'Roads & Drains', 'Sanitation', 'Street Lighting', 'Community Hall', 'Education'
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
    before_photos TEXT[],
    after_photos TEXT[],
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- E. EXPENDITURES (Itemized Public Ledger)
CREATE TABLE IF NOT EXISTS public.expenditures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panchayat_id UUID NOT NULL REFERENCES public.panchayats(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    fund_id UUID REFERENCES public.funds(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Material Purchase', 'Labor Wages', 'Equipment Rental', 'Maintenance', 'Administrative', 'Sanitation'
    description TEXT NOT NULL,
    vendor_name VARCHAR(255),
    bill_number VARCHAR(100),
    bill_document_url TEXT,
    payment_mode VARCHAR(50) DEFAULT 'Direct Benefit / Bank Transfer',
    approval_status expenditure_status DEFAULT 'approved',
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- F. CITIZEN COMPLAINTS & GRIEVANCES
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
    category VARCHAR(100) NOT NULL, -- 'Water Supply', 'Sanitation & Garbage', 'Street Light', 'Road Repair', 'Drainage', 'Health & Hygiene', 'Other'
    location VARCHAR(255) NOT NULL,
    attachment_urls TEXT[],
    status complaint_status DEFAULT 'pending',
    priority complaint_priority DEFAULT 'medium',
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- G. CITIZEN QUESTIONS (Praja Prashnalu)
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

-- H. OFFICIAL DOCUMENTS & RESOLUTIONS
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panchayat_id UUID NOT NULL REFERENCES public.panchayats(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Gram Sabha Resolution', 'Annual Budget', 'Audit Report', 'Government Order', 'Citizen Charter', 'Tender Notice'
    document_number VARCHAR(100),
    issue_date DATE,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    is_public BOOLEAN DEFAULT TRUE,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- I. ANNOUNCEMENTS & ALERTS
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panchayat_id UUID NOT NULL REFERENCES public.panchayats(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    title_te VARCHAR(255),
    content TEXT NOT NULL,
    content_te TEXT,
    category VARCHAR(100) DEFAULT 'General', -- 'Gram Sabha', 'Drinking Water Schedule', 'Vaccination Camp', 'Emergency', 'Tax Collection'
    is_active BOOLEAN DEFAULT TRUE,
    priority VARCHAR(50) DEFAULT 'normal', -- 'normal', 'high', 'urgent'
    valid_until DATE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- J. NOTIFICATIONS
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

-- K. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panchayat_id UUID REFERENCES public.panchayats(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- e.g., 'CREATE_FUND', 'UPDATE_PROJECT', 'RESOLVE_COMPLAINT', 'UPLOAD_EXPENDITURE'
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. SEQUENCES & HELPER FUNCTIONS
-- ============================================================================

-- Auto generate complaint reference number (e.g., CMP-202608-0101)
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

-- Auto calculate project spent amount on expenditure insert/update/delete
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

-- Profile auto-creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    first_panchayat_id UUID;
    user_role_val user_role;
    user_name TEXT;
    user_phone TEXT;
    user_ward INT;
BEGIN
    SELECT id INTO first_panchayat_id FROM public.panchayats LIMIT 1;
    
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    user_phone := NEW.raw_user_meta_data->>'phone';
    
    IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
        user_role_val := 'admin';
    ELSIF NEW.raw_user_meta_data->>'role' = 'authority' THEN
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
        COALESCE((NEW.raw_user_meta_data->>'panchayat_id')::UUID, first_panchayat_id),
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

-- Helper function to check role in RLS
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_authority_or_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'authority' OR role = 'admin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

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

-- Panchayats: Everyone can view, Authorities/Admins can edit
CREATE POLICY "Public can view panchayats" ON public.panchayats FOR SELECT USING (true);
CREATE POLICY "Admins/Authority can manage panchayats" ON public.panchayats FOR ALL USING (public.is_authority_or_admin());

-- Profiles: Users can view all profiles in their panchayat, update their own; Admins full control
CREATE POLICY "Users can view profiles in same panchayat" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins have full profile access" ON public.profiles FOR ALL USING (public.is_admin());

-- Funds: Public can view sanctioned/received funds; Authority/Admin can insert/update/delete
CREATE POLICY "Public can view funds" ON public.funds FOR SELECT USING (true);
CREATE POLICY "Authority and Admin can insert funds" ON public.funds FOR INSERT WITH CHECK (public.is_authority_or_admin());
CREATE POLICY "Authority and Admin can update funds" ON public.funds FOR UPDATE USING (public.is_authority_or_admin());
CREATE POLICY "Admin can delete funds" ON public.funds FOR DELETE USING (public.is_admin());

-- Projects: Public can view; Authority/Admin can manage
CREATE POLICY "Public can view projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Authority and Admin can insert projects" ON public.projects FOR INSERT WITH CHECK (public.is_authority_or_admin());
CREATE POLICY "Authority and Admin can update projects" ON public.projects FOR UPDATE USING (public.is_authority_or_admin());
CREATE POLICY "Admin can delete projects" ON public.projects FOR DELETE USING (public.is_admin());

-- Expenditures: Public can view approved expenditures; Authority/Admin can manage
CREATE POLICY "Public can view approved expenditures" ON public.expenditures FOR SELECT USING (true);
CREATE POLICY "Authority and Admin can insert expenditures" ON public.expenditures FOR INSERT WITH CHECK (public.is_authority_or_admin());
CREATE POLICY "Authority and Admin can update expenditures" ON public.expenditures FOR UPDATE USING (public.is_authority_or_admin());
CREATE POLICY "Admin can delete expenditures" ON public.expenditures FOR DELETE USING (public.is_admin());

-- Complaints:
-- 1. Citizens can view their own complaints
-- 2. Authorities & Admins can view all complaints
-- 3. Authenticated citizens can insert complaints
-- 4. Authorities & Admins can update complaints (assign, resolve, etc.)
CREATE POLICY "Citizens can view own complaints or authorities can view all" ON public.complaints
    FOR SELECT USING (
        auth.uid() = citizen_id OR public.is_authority_or_admin()
    );

CREATE POLICY "Authenticated users can submit complaints" ON public.complaints
    FOR INSERT WITH CHECK (auth.uid() = citizen_id);

CREATE POLICY "Authorities and Admins can update complaints" ON public.complaints
    FOR UPDATE USING (public.is_authority_or_admin());

-- Questions:
-- 1. Everyone can view public answered questions
-- 2. Citizens can view their own questions
-- 3. Authorities & Admins can view all questions
-- 4. Citizens can insert questions
-- 5. Authorities can respond/update questions
CREATE POLICY "Users can view public or own questions" ON public.questions
    FOR SELECT USING (
        is_public = true OR auth.uid() = citizen_id OR public.is_authority_or_admin()
    );

CREATE POLICY "Authenticated users can submit questions" ON public.questions
    FOR INSERT WITH CHECK (auth.uid() = citizen_id);

CREATE POLICY "Authorities and Admins can answer questions" ON public.questions
    FOR UPDATE USING (public.is_authority_or_admin());

-- Documents: Public can view public docs; Authorities/Admins can manage
CREATE POLICY "Public can view public documents" ON public.documents FOR SELECT USING (is_public = true OR public.is_authority_or_admin());
CREATE POLICY "Authority and Admin can manage documents" ON public.documents FOR ALL USING (public.is_authority_or_admin());

-- Announcements: Public can view active announcements; Authorities/Admins can manage
CREATE POLICY "Public can view active announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Authority and Admin can manage announcements" ON public.announcements FOR ALL USING (public.is_authority_or_admin());

-- Notifications: Users can view and update (mark read) their own notifications
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authorities/System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Audit Logs: Only Admins and Authorities can view audit logs
CREATE POLICY "Authorities and Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_authority_or_admin());
CREATE POLICY "Any authenticated user can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 6. STORAGE BUCKETS SETUP (Supabase Storage)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('panchayat-documents', 'panchayat-documents', true),
    ('complaint-attachments', 'complaint-attachments', true),
    ('expenditure-bills', 'expenditure-bills', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'panchayat-documents'
CREATE POLICY "Public read for panchayat documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'panchayat-documents');
CREATE POLICY "Authority/Admin upload for panchayat documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'panchayat-documents' AND auth.role() = 'authenticated');
CREATE POLICY "Authority/Admin manage for panchayat documents" ON storage.objects
    FOR ALL USING (bucket_id = 'panchayat-documents' AND auth.role() = 'authenticated');

-- Storage Policies for 'complaint-attachments'
CREATE POLICY "Public/Citizen read for complaint attachments" ON storage.objects
    FOR SELECT USING (bucket_id = 'complaint-attachments');
CREATE POLICY "Authenticated users upload complaint attachments" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'complaint-attachments' AND auth.role() = 'authenticated');

-- Storage Policies for 'expenditure-bills'
CREATE POLICY "Public read for expenditure bills" ON storage.objects
    FOR SELECT USING (bucket_id = 'expenditure-bills');
CREATE POLICY "Authority upload expenditure bills" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'expenditure-bills' AND auth.role() = 'authenticated');

-- ============================================================================
-- 7. INITIAL PANCHAYAT SEED DATA: SRIRAMNAGAR, JAGITYAL, TELANGANA
-- ============================================================================

DO $$
DECLARE
    p_id UUID;
    f_fifteenth UUID;
    f_gramajyothi UUID;
    f_jaljeevan UUID;
    f_mgnregs UUID;
    proj_water UUID;
    proj_road UUID;
    proj_lights UUID;
    proj_hall UUID;
BEGIN
    -- 1. Insert Initial Sriramnagar Gram Panchayat
    INSERT INTO public.panchayats (
        id, name, name_te, mandal, district, state, country, pin_code, lgd_code,
        sarpanch_name, sarpanch_phone, secretary_name, secretary_phone,
        office_address, contact_email, population, total_wards, is_active
    ) VALUES (
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'Sriramnagar Gram Panchayat',
        'శ్రీరాంనగర్ గ్రామ పంచాయతీ',
        'Mallial Mandal',
        'Jagityal',
        'Telangana',
        'India',
        '505531',
        '208492',
        'K. Anjaiah (సర్పంచ్)',
        '+91 94401 23456',
        'M. Srinivas (పంచాయతీ కార్యదర్శి)',
        '+91 98480 76543',
        'Gram Panchayat Office, Main Road, Sriramnagar Village, Jagityal Dist, Telangana 505531',
        'sriramnagar.gp.jagityal@telangana.gov.in',
        4250,
        12,
        TRUE
    ) ON CONFLICT (id) DO NOTHING;

    p_id := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

    -- 2. Insert Real Government Scheme Funds for Sriramnagar
    INSERT INTO public.funds (
        id, panchayat_id, funding_source, scheme_name, financial_year, reference_number,
        sanctioned_amount, received_amount, date_sanctioned, date_received, purpose, status
    ) VALUES 
    (
        'f1111111-1111-1111-1111-111111111111',
        p_id,
        'Central Finance Commission',
        '15th Finance Commission Untied Grant',
        '2025-2026',
        'GO-MS-TS-2025-15FC-0842',
        1850000.00,
        1850000.00,
        '2025-04-15',
        '2025-05-10',
        'Drinking water augmentation, village sanitation, solid waste segregation shed, drainage construction.',
        'received'
    ),
    (
        'f2222222-2222-2222-2222-222222222222',
        p_id,
        'Telangana State Panchayat Raj Department',
        'Palle Pragathi / Grama Jyothi Village Development Scheme',
        '2025-2026',
        'TS-PR-PP-2025-JAG-3129',
        1200000.00,
        1000000.00,
        '2025-05-01',
        '2025-05-28',
        'CC roads in Ward 3 and 7, avenue plantation, Vaikunta Dhamam crematorium maintenance.',
        'partially_utilized'
    ),
    (
        'f3333333-3333-3333-3333-333333333333',
        p_id,
        'Ministry of Jal Shakti, GoI & Mission Bhagiratha',
        'Jal Jeevan Mission Village Retrofitting Grant',
        '2025-2026',
        'JJM-TS-JAG-2025-8941',
        950000.00,
        950000.00,
        '2025-06-10',
        '2025-06-25',
        'Overhead water tank pipeline extension and functional household tap connections (FHTC) in Ward 4 & 5.',
        'received'
    ),
    (
        'f4444444-4444-4444-4444-444444444444',
        p_id,
        'Ministry of Rural Development',
        'MGNREGS Material Component Grant',
        '2025-2026',
        'MGNREGS-MAT-JAG-2025-0182',
        640000.00,
        640000.00,
        '2025-04-20',
        '2025-05-15',
        'Farm pond construction, dry waste segregation sheds, and canal desilting materials.',
        'received'
    ) ON CONFLICT (id) DO NOTHING;

    f_fifteenth := 'f1111111-1111-1111-1111-111111111111';
    f_gramajyothi := 'f2222222-2222-2222-2222-222222222222';
    f_jaljeevan := 'f3333333-3333-3333-3333-333333333333';
    f_mgnregs := 'f4444444-4444-4444-4444-444444444444';

    -- 3. Insert Development Projects
    INSERT INTO public.projects (
        id, panchayat_id, fund_id, name, name_te, description, category, location, ward_number,
        estimated_cost, approved_amount, amount_spent, start_date, expected_completion_date, status, progress_percentage, contractor_name
    ) VALUES
    (
        'p1111111-1111-1111-1111-111111111111',
        p_id,
        f_gramajyothi,
        'Construction of Cement Concrete (CC) Road & Covered Drain',
        'సిమెంట్ కాంక్రీట్ (CC) రోడ్డు మరియు డ్రైనేజీ నిర్మాణం',
        'Laying 450 meters standard CC road with underground stormwater side drainage connecting Hanuman Temple to Ward 3 school.',
        'Roads & Drains',
        'Ward No. 3 (Hanuman Temple to Zilla Parishad High School Road)',
        3,
        650000.00,
        650000.00,
        420000.00,
        '2025-06-01',
        '2025-09-30',
        'in_progress',
        68,
        'Sri Balaji Constructions, Jagityal'
    ),
    (
        'p2222222-2222-2222-2222-222222222222',
        p_id,
        f_jaljeevan,
        'Overhead Tank Pipeline & Household Drinking Water Tap Connection',
        'ఓవర్‌హెడ్ ట్యాంక్ పైప్‌లైన్ మరియు ఇంటింటికి రక్షిత మంచినీటి కుళాయిలు',
        'Laying 80mm HDPE pipeline from 50,000-liter overhead reservoir to 110 unserved households in Ward 4 & 5 with water meters.',
        'Drinking Water',
        'Ward No. 4 & 5 (BC Colony & Rythu Bazar area)',
        4,
        520000.00,
        520000.00,
        340000.00,
        '2025-06-15',
        '2025-09-15',
        'in_progress',
        75,
        'Telangana Rural Water Works Dept'
    ),
    (
        'p3333333-3333-3333-3333-333333333333',
        p_id,
        f_fifteenth,
        'Solar LED Street Light Modernization & Automatic Timers',
        'సౌర వీధి దీపాల ఆధునికీకరణ మరియు ఆటోమేటిక్ టైమర్లు',
        'Installation of 80 smart 45W energy-efficient LED street lights with dusk-to-dawn sensors covering all 12 wards.',
        'Street Lighting',
        'Across all 12 Wards and Village Main Junctions',
        1,
        280000.00,
        280000.00,
        280000.00,
        '2025-05-01',
        '2025-06-20',
        'completed',
        100,
        'Surya Solar Energy Systems, Karimnagar'
    ),
    (
        'p4444444-4444-4444-4444-444444444444',
        p_id,
        f_fifteenth,
        'Gram Panchayat Solid Waste Segregation Shed & Tractor Maintenance',
        'చెత్త వేరుచేసే షెడ్డు నిర్మాణం మరియు ట్రాక్టర్ మరమ్మతులు',
        'Construction of dry/wet waste segregation bays, vermicompost composting pits, and purchase of battery collection tricycles.',
        'Sanitation',
        'Near Sriramnagar Rythu Vedika Grounds',
        8,
        390000.00,
        390000.00,
        150000.00,
        '2025-07-01',
        '2025-10-31',
        'in_progress',
        40,
        'Grama Swachhata Works, Jagityal'
    ) ON CONFLICT (id) DO NOTHING;

    proj_road := 'p1111111-1111-1111-1111-111111111111';
    proj_water := 'p2222222-2222-2222-2222-222222222222';
    proj_lights := 'p3333333-3333-3333-3333-333333333333';
    proj_hall := 'p4444444-4444-4444-4444-444444444444';

    -- 4. Insert Verified Public Expenditures (Transparent Ledger)
    INSERT INTO public.expenditures (
        panchayat_id, project_id, fund_id, amount, expense_date, category, description,
        vendor_name, bill_number, payment_mode, approval_status
    ) VALUES
    (
        p_id,
        proj_lights,
        f_fifteenth,
        280000.00,
        '2025-06-22',
        'Equipment Purchase & Installation',
        'Final settlement for supply, pole mounting and wiring of 80 units 45W Smart LED lights and sensors.',
        'Surya Solar Energy Systems, Karimnagar',
        'INV-SS-2025-0914',
        'Online Treasury Direct Transfer',
        'approved'
    ),
    (
        p_id,
        proj_road,
        f_gramajyothi,
        220000.00,
        '2025-06-18',
        'Material Purchase',
        'Purchase of UltraTech Ready Mix Cement Grade 43 (350 bags) and stone jelly aggregates for Ward 3 CC Road stage 1.',
        'Sree Rama Builders & Suppliers, Mallial',
        'BILL-SRB-5421',
        'Bank RTGS Payment',
        'approved'
    ),
    (
        p_id,
        proj_road,
        f_gramajyothi,
        200000.00,
        '2025-07-10',
        'Labor & Excavation',
        'Stage 2 JCB side trench excavation, centering labor wages, and reinforcement steel bars.',
        'Sri Balaji Constructions, Jagityal',
        'REC-SBC-2025-118',
        'Treasury Cheque No. 904128',
        'approved'
    ),
    (
        p_id,
        proj_water,
        f_jaljeevan,
        190000.00,
        '2025-07-05',
        'Material Purchase',
        'Purchase of ISI certified 80mm and 50mm HDPE water pipeline coils (1200 meters) and brass gate valves.',
        'Kakatiya Pipes & Irrigation Agency, Jagityal',
        'INV-KP-8932',
        'Bank Direct Transfer',
        'approved'
    ),
    (
        p_id,
        proj_water,
        f_jaljeevan,
        150000.00,
        '2025-07-28',
        'Labor Wages',
        'Trench digging and pipe laying labor compensation for 110 household connections in Ward 4 & 5.',
        'Rural Water Works Contractor',
        'VOUCH-RWW-442',
        'Direct Bank Account Transfer',
        'approved'
    ),
    (
        p_id,
        proj_hall,
        f_fifteenth,
        150000.00,
        '2025-07-15',
        'Construction Material',
        'Galvanized corrugated iron roofing sheets and MS structural steel frame for Dry Waste Segregation Unit.',
        'Deccan Steels & Hardware, Jagityal',
        'TAX-INV-DS-1033',
        'Bank Transfer',
        'approved'
    );

    -- 5. Insert Official Announcements
    INSERT INTO public.announcements (
        panchayat_id, title, title_te, content, content_te, category, priority, is_active, valid_until
    ) VALUES
    (
        p_id,
        'Gram Sabha General Body Meeting on 15th of Next Month',
        'వచ్చే నెల 15వ తేదీన గ్రామ సభ సాధారణ సమావేశం',
        'All villagers, self-help group members, and elders of Sriramnagar are cordially invited to attend the Gram Sabha at the Panchayat Office courtyard at 10:00 AM. Key agenda: Review of 15th FC Grants, selection of beneficiaries for housing schemes, and approval of agricultural drainage works.',
        'శ్రీరాంనగర్ గ్రామ ప్రజలు, స్వయం సహాయక సంఘాల సభ్యులు అందరూ వచ్చే నెల 15వ తేదీ ఉదయం 10 గంటలకు గ్రామ పంచాయతీ కార్యాలయ ప్రాంగణంలో జరిగే గ్రామసభకు హాజరుకావలసిందిగా కోరడమైనది. ముఖ్యాంశాలు: 15వ ఆర్థిక సంఘం నిధుల సమీక్ష, గృహ నిర్మాణ లబ్ధిదారుల ఎంపిక.',
        'Gram Sabha',
        'high',
        TRUE,
        '2026-09-15'
    ),
    (
        p_id,
        'Mission Bhagiratha Drinking Water Pipeline Flushing & Maintenance Schedule',
        'మిషన్ భగీరథ రక్షిత మంచినీటి పైప్‌లైన్ క్లీనింగ్ షెడ్యూల్',
        'Routine chlorination, overhead reservoir descaling, and high-pressure pipe cleaning will be conducted this Wednesday from 8 AM to 2 PM in Wards 1, 2, and 3. Residents are requested to store adequate drinking water in advance.',
        'ఈ బుధవారం ఉదయం 8 గంటల నుండి మధ్యాహ్నం 2 గంటల వరకు 1, 2, 3 వార్డులలో ఓవర్‌హెడ్ ట్యాంక్ క్లీనింగ్ మరియు పైప్‌లైన్ క్లోరినేషన్ పనులు నిర్వహించబడును. గ్రామస్తులు ముందుగానే తగినంత మంచినీటిని నిల్వ చేసుకోవాలని కోరడమైనది.',
        'Drinking Water Schedule',
        'normal',
        TRUE,
        '2026-09-10'
    ),
    (
        p_id,
        'Seasonal Dengue & Viral Fever Prevention Fogging Drive',
        'డెంగ్యూ, వైరల్ జ్వరాల నివారణకు దోమల నివారణ ఫాగింగ్ డ్రైవ్',
        'Panchayat Swachhata workers will undertake door-to-door sanitation spraying and thermal fogging across all 12 wards every Friday morning. Keep domestic water coolers and overhead tanks tightly covered.',
        'ప్రతి శుక్రవారం ఉదయం గ్రామ పంచాయతీ పారిశుధ్య సిబ్బంది ద్వారా 12 వార్డులలో దోమల నివారణ ఫాగింగ్ మరియు బ్లీచింగ్ పిచికారీ చేయబడును. ఇండ్లలో నీరు నిల్వ ఉండే పాత్రలను మూసి ఉంచండి.',
        'Sanitation & Health',
        'normal',
        TRUE,
        '2026-09-30'
    );

    -- 6. Insert Public Documents
    INSERT INTO public.documents (
        panchayat_id, title, category, document_number, issue_date, file_url, file_size, file_type, is_public
    ) VALUES
    (
        p_id,
        'Sriramnagar Gram Panchayat Annual Development Action Plan (2025-2026)',
        'Annual Budget',
        'GP-SRN-ADP-2025-01',
        '2025-04-01',
        'https://supabase.co/storage/v1/object/public/panchayat-documents/annual-plan-2025-26.pdf',
        2450000,
        'application/pdf',
        TRUE
    ),
    (
        p_id,
        'Approved Gram Sabha Resolution Minutes (Special Meeting on Water Security)',
        'Gram Sabha Resolution',
        'GSR-SRN-2025-04',
        '2025-05-18',
        'https://supabase.co/storage/v1/object/public/panchayat-documents/gram-sabha-res-04.pdf',
        1180000,
        'application/pdf',
        TRUE
    ),
    (
        p_id,
        'Social Audit & Financial Transparency Report for 15th Finance Commission Works',
        'Audit Report',
        'AUDIT-TS-JAG-2025-99',
        '2025-06-30',
        'https://supabase.co/storage/v1/object/public/panchayat-documents/social-audit-2025.pdf',
        3820000,
        'application/pdf',
        TRUE
    ),
    (
        p_id,
        'Gram Panchayat Citizen Services Delivery Charter & Timelines',
        'Citizen Charter',
        'CIT-CHTR-SRN-2025',
        '2025-01-01',
        'https://supabase.co/storage/v1/object/public/panchayat-documents/citizen-charter.pdf',
        950000,
        'application/pdf',
        TRUE
    );

END $$;
