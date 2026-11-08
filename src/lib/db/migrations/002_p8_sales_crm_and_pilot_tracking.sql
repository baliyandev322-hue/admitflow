-- ========================================================
-- 18. Internal B2B Sales Prospects & Pipeline
-- ========================================================
CREATE TABLE IF NOT EXISTS sales_prospects (
    id VARCHAR(100) PRIMARY KEY,
    institute_name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    website VARCHAR(255),
    contact_person VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'IIT_JEE_NEET',
    branch_count INT DEFAULT 1,
    main_problem TEXT,
    stage VARCHAR(50) NOT NULL DEFAULT 'PROSPECT_IDENTIFIED',
    last_contact_date TIMESTAMP WITH TIME ZONE,
    next_followup_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    deal_value_estimated NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_prospects_email ON sales_prospects(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_prospects_phone ON sales_prospects(phone);

-- ========================================================
-- 19. B2B Sales Activity Timeline
-- ========================================================
CREATE TABLE IF NOT EXISTS sales_activities (
    id VARCHAR(100) PRIMARY KEY,
    prospect_id VARCHAR(100) NOT NULL REFERENCES sales_prospects(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    outcome VARCHAR(100),
    notes TEXT NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 20. Prerna Pilot Live Tracking Record
-- ========================================================
CREATE TABLE IF NOT EXISTS pilot_tracking (
    id VARCHAR(100) PRIMARY KEY,
    institute_id VARCHAR(100) NOT NULL UNIQUE,
    institute_name VARCHAR(255) NOT NULL,
    owner_acceptance_status VARCHAR(50) DEFAULT 'PENDING_SIGN_OFF',
    authorization_confirmed BOOLEAN DEFAULT FALSE,
    widget_installation_approved BOOLEAN DEFAULT FALSE,
    pilot_start_date TIMESTAMP WITH TIME ZONE,
    pilot_end_date TIMESTAMP WITH TIME ZONE,
    demo_status VARCHAR(50) DEFAULT 'NOT_SCHEDULED',
    technical_issues JSONB DEFAULT '[]',
    counselor_feedback TEXT DEFAULT '',
    owner_feedback TEXT DEFAULT '',
    paid_conversion_status VARCHAR(50) DEFAULT 'PILOT_ACTIVE',
    proposed_tier VARCHAR(50) DEFAULT 'GROWTH',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

