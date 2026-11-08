-- ====================================================================
-- ADMITFLOW AI: ENTERPRISE POSTGRESQL + PGVECTOR PRODUCTION DDL
-- Multi-Tenant Educational Admission Management and AI Orchestration
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. ENUM Types
CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',
    'INSTITUTE_OWNER',
    'BRANCH_MANAGER',
    'ADMISSION_COUNSELLOR',
    'SUPPORT_STAFF'
);

CREATE TYPE lead_status AS ENUM (
    'NEW',
    'CONTACTED',
    'INTERESTED',
    'COUNSELLING_SCHEDULED',
    'TRIAL_CLASS',
    'ADMISSION_CONFIRMED',
    'LOST'
);

CREATE TYPE lead_source AS ENUM (
    'WEBSITE_CHAT',
    'WHATSAPP',
    'DIRECT_WALKIN',
    'GOOGLE_ADS',
    'META_ADS',
    'REFERRAL',
    'CALL'
);

CREATE TYPE subscription_tier AS ENUM (
    'STARTER',
    'GROWTH',
    'PRO',
    'ENTERPRISE'
);

CREATE TYPE appointment_status AS ENUM (
    'SCHEDULED',
    'COMPLETED',
    'CANCELLED',
    'RESCHEDULED',
    'NO_SHOW'
);

CREATE TYPE followup_status AS ENUM (
    'PENDING',
    'APPROVED',
    'SENT',
    'REJECTED',
    'CANCELLED'
);

-- 3. Institutes (Tenant Root)
CREATE TABLE institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    website VARCHAR(255),
    logo_url TEXT,
    ai_tone VARCHAR(50) DEFAULT 'helpful_professional',
    welcome_message TEXT DEFAULT 'Namaste! Welcome to our institute. How can I help you regarding admissions today?',
    currency VARCHAR(10) DEFAULT 'INR',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Branches (Multi-Branch Intelligence)
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_headquarters BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'ADMISSION_COUNSELLOR',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Courses & Offerings
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    category VARCHAR(100),
    duration_weeks INT DEFAULT 12,
    base_fee DECIMAL(12, 2) NOT NULL,
    min_installment_fee DECIMAL(12, 2) DEFAULT 0,
    max_discount_pct DECIMAL(5, 2) DEFAULT 10.0,
    description TEXT,
    eligibility TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Batches
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    batch_name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    timings VARCHAR(100) NOT NULL,
    days_of_week VARCHAR(100) DEFAULT 'Mon-Fri',
    max_seats INT DEFAULT 40,
    enrolled_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ENROLLING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Knowledge Documents (RAG Store)
CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_url TEXT,
    raw_content TEXT NOT NULL,
    chunk_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'INDEXED',
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Document Chunks & Vector Embeddings (Isolated by Tenant)
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding vector(768), -- Compatible with Gemini text-embedding-004 & OpenAI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX document_chunks_embedding_idx ON document_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX document_chunks_institute_idx ON document_chunks(institute_id);

-- 10. Leads (Core CRM)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    assigned_counsellor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    student_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    status lead_status DEFAULT 'NEW',
    source lead_source DEFAULT 'WEBSITE_CHAT',
    lead_score INT DEFAULT 50,
    drop_off_reason TEXT,
    next_best_action TEXT,
    notes TEXT,
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_followup_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX leads_institute_status_idx ON leads(institute_id, status);
CREATE INDEX leads_phone_idx ON leads(institute_id, phone);

-- 11. Lead Activities & Timeline
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_type VARCHAR(50) DEFAULT 'AI_AGENT', -- 'AI_AGENT', 'COUNSELLOR', 'STUDENT'
    activity_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Student Conversations & Messages
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    channel VARCHAR(50) DEFAULT 'WEB_CHAT', -- 'WEB_CHAT', 'WHATSAPP'
    session_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL, -- 'STUDENT', 'AI_ASSISTANT', 'COUNSELLOR'
    content TEXT NOT NULL,
    rag_sources JSONB DEFAULT '[]',
    tool_calls JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Counselling Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    counsellor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INT DEFAULT 30,
    mode VARCHAR(50) DEFAULT 'ONLINE_MEET', -- 'ONLINE_MEET', 'OFFLINE_CAMPUS'
    status appointment_status DEFAULT 'SCHEDULED',
    meeting_link TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Constraint: Prevent double booking for counsellors
CREATE UNIQUE INDEX counsellor_appointment_slot_unique 
ON appointments(counsellor_id, scheduled_at) 
WHERE status = 'SCHEDULED';

-- 14. Follow-up Tasks & Human Approval Automation
CREATE TABLE followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    counsellor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    suggested_message TEXT NOT NULL,
    channel VARCHAR(50) DEFAULT 'WHATSAPP',
    status followup_status DEFAULT 'PENDING',
    is_overdue BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. AI Agent Skills & Execution Audit Log
CREATE TABLE agent_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    triggered_by VARCHAR(50) DEFAULT 'STUDENT_CHAT',
    input_payload JSONB NOT NULL,
    output_payload JSONB,
    status VARCHAR(50) NOT NULL, -- 'SUCCESS', 'FAILED', 'ESCALATED'
    execution_time_ms INT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Subscriptions & Billing
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID UNIQUE NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    tier subscription_tier DEFAULT 'GROWTH',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    razorpay_customer_id VARCHAR(255),
    razorpay_subscription_id VARCHAR(255),
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
    lead_quota INT DEFAULT 2500,
    leads_used INT DEFAULT 0,
    rag_query_quota INT DEFAULT 1000,
    rag_queries_used INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Row-Level Security (RLS) Setup
ALTER TABLE institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;

-- Note: RLS Policies ensure tenant isolation by binding current_setting('app.current_institute_id')

