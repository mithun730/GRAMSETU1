-- ============================================================================
-- GRAM SETU (గ్రామ సేతు) - DEVELOPMENT SEED DATA
-- Purpose: Initial baseline reference data for Development & Testing
-- Initial Entity: Sriramnagar Gram Panchayat, Mallial Mandal, Jagityal, Telangana
-- Note: This seed file is strictly separated from core schema migrations.
-- ============================================================================

DO $$
DECLARE
    p_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    f_fifteenth UUID := 'f1111111-1111-1111-1111-111111111111';
    f_gramajyothi UUID := 'f2222222-2222-2222-2222-222222222222';
    f_jaljeevan UUID := 'f3333333-3333-3333-3333-333333333333';
    f_mgnregs UUID := 'f4444444-4444-4444-4444-444444444444';
    proj_road UUID := 'p1111111-1111-1111-1111-111111111111';
    proj_water UUID := 'p2222222-2222-2222-2222-222222222222';
    proj_lights UUID := 'p3333333-3333-3333-3333-333333333333';
    proj_hall UUID := 'p4444444-4444-4444-4444-444444444444';
BEGIN
    -- 1. Initial Panchayat: Sriramnagar, Mallial Mandal, Jagityal, Telangana, India
    INSERT INTO public.panchayats (
        id, name, name_te, mandal, district, state, country, pin_code, lgd_code,
        sarpanch_name, sarpanch_phone, secretary_name, secretary_phone,
        office_address, contact_email, population, total_wards, is_active
    ) VALUES (
        p_id,
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
        'Gram Panchayat Office, Main Road, Sriramnagar Village, Mallial Mandal, Jagityal Dist, Telangana 505531',
        'sriramnagar.gp.jagityal@telangana.gov.in',
        4250,
        12,
        TRUE
    ) ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        name_te = EXCLUDED.name_te,
        mandal = EXCLUDED.mandal,
        district = EXCLUDED.district,
        sarpanch_name = EXCLUDED.sarpanch_name,
        secretary_name = EXCLUDED.secretary_name,
        updated_at = NOW();

    -- 2. Government Scheme Grant Funds
    INSERT INTO public.funds (
        id, panchayat_id, funding_source, scheme_name, financial_year, reference_number,
        sanctioned_amount, received_amount, date_sanctioned, date_received, purpose, status
    ) VALUES 
    (
        f_fifteenth,
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
        f_gramajyothi,
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
        f_jaljeevan,
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
        f_mgnregs,
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

    -- 3. Development Projects
    INSERT INTO public.projects (
        id, panchayat_id, fund_id, name, name_te, description, category, location, ward_number,
        estimated_cost, approved_amount, amount_spent, start_date, expected_completion_date, status, progress_percentage, contractor_name
    ) VALUES
    (
        proj_road,
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
        proj_water,
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
        proj_lights,
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
        proj_hall,
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

    -- 4. Itemized Public Ledger Expenditures
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
    ) ON CONFLICT DO NOTHING;

    -- 5. Official Announcements
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
    ) ON CONFLICT DO NOTHING;

    -- 6. Public Documents & Resolutions
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
    ) ON CONFLICT DO NOTHING;

END $$;
