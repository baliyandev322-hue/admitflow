# AdmitFlow AI — System Architecture & Multi-Tenant Blueprint

```
                     ┌───────────────────────────────────────────┐
                     │     Educational Institute Leads           │
                     │  (Website Chat, WhatsApp, Google Ads)     │
                     └─────────────────────┬─────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js 14 App Router Edge                      │
│                                                                        │
│  ┌───────────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │  Public Widget / Chat │  │ Admin Dashboard  │  │   /api/mcp      │  │
│  │   (/widget, /chat)    │  │  (/crm, /cal)    │  │ (Official SDK)  │  │
│  └───────────┬───────────┘  └────────┬─────────┘  └────────┬────────┘  │
│              │                       │                     │           │
│              └───────────────────────┼─────────────────────┘           │
│                                      │                                 │
│                                      ▼                                 │
│                         Authentication & Rate Limiter                  │
│                        (JWT RBAC + Sliding Window IP)                  │
└──────────────────────────────────────┬─────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    AdmitFlow AI Agent Orchestrator                     │
│                                                                        │
│  ┌───────────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ Google Gemini 3.5     │  │  RAG Knowledge   │  │  MCP Server     │  │
│  │ Flash Lite Model      │  │  Vector Cosine   │  │  33 Atomic Tools│  │
│  └───────────────────────┘  └──────────────────┘  └─────────────────┘  │
└──────────────────────────────────────┬─────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 Dual-Engine Multi-Tenant Database Core                 │
│                                                                        │
│  [Production PostgreSQL 16 + pgvector]   <--- Strict Production Guard  │
│  [Local Persistent JSON Engine]           <--- Zero-Config Dev Mode    │
│                                                                        │
│  Tables Isolated by `institute_id`:                                    │
│  - institutes, branches, users, courses, batches, documents, chunks,    │
│    leads, lead_activities, appointments, followups, executions, docs  │
└────────────────────────────────────────────────────────────────────────┘
```

## Architectural Highlights

1. **Model Context Protocol (MCP)**:
   * Official `@modelcontextprotocol/sdk` implementation (v1.32.2).
   * 33 typed tools with runtime Zod validation.
   * Autonomous Gemini function calling via `geminiToolBridge`.

2. **External Connectors (Standby Architecture)**:
   * **Google Calendar**: Full OAuth 2.0 calendar connector with double-booking prevention and Google Meet link generation.
   * **WhatsApp Business Platform**: Meta Cloud API v21.0 connector with parameter validation, webhook listener, and mandatory DPDP student consent verification.
   * **Student Document Completeness**: Automated document tracking (Class 10/12, Aadhaar, Photos), file size/mime type validation, and missing document follow-up automation.

3. **Multi-Tenant Security**:
   * All data operations strictly isolated by `institute_id`.
   * Cross-tenant query execution is physically blocked at the database and tool layer.
