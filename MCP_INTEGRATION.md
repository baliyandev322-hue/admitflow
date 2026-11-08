# AdmitFlow AI — Model Context Protocol (MCP) Integration Guide

## 1. Executive Overview

AdmitFlow AI natively supports the official **Model Context Protocol (MCP)** specification (Protocol version `2024-11-05`), powered by the official `@modelcontextprotocol/sdk` (v1.32.2).

MCP turns AdmitFlow AI from a traditional chatbot into an **action-oriented admission operating system**. AI models (Google Gemini 3.5 Flash Lite, Claude, or internal agents) can safely discover, inspect, and invoke structured institute tools without hallucinating or bypassing business rules.

---

## 2. MCP Server Architecture & Endpoints

* **Protocol Version:** `2024-11-05`
* **Official SDK:** `@modelcontextprotocol/sdk` v1.32.2
* **Primary Endpoint:** `/api/mcp` (Streamable HTTP & JSON-RPC 2.0)
* **Transport:** Streamable HTTP / Server-Sent Events (SSE) compatible
* **Authentication:** Bearer JWT token (`Authorization: Bearer <token>`) or `x-institute-id` header for authenticated backend services.

```
┌────────────────────────────────────────────────────────┐
│          External AI Agent / Gemini 3.5 Flash Lite     │
└──────────────────────────┬─────────────────────────────┘
                           │ JSON-RPC 2.0 (Streamable HTTP)
                           ▼
┌────────────────────────────────────────────────────────┐
│             AdmitFlow MCP Server (/api/mcp)            │
│  - Rate Limiter (120 req/min sliding window)           │
│  - Tenant Isolation Guard (Server-derived instituteId) │
│  - Idempotency Cache (30s duplicate prevention)        │
│  - Strict Zod Input Schema Validator                   │
└──────────────────────────┬─────────────────────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
┌──────────────┐   ┌───────────────┐   ┌───────────────┐
│ Core CRM &   │   │ Google Cal    │   │ WhatsApp Meta │
│ RAG Tools    │   │ Connector     │   │ Cloud API     │
└──────────────┘   └───────────────┘   └───────────────┘
```

---

## 3. Registered Tool Catalog (33 Atomic Tools)

### A. CRM Tools
1. `create_lead`: Creates new admission lead with automatic phone deduplication.
2. `get_lead`: Retrieves student lead timeline, score, and contact info.
3. `update_lead`: Updates student status (`NEW`, `CONTACTED`, `INTERESTED`, `COUNSELLING_SCHEDULED`, `TRIAL_CLASS`, `ADMISSION_CONFIRMED`, `LOST`).
4. `list_leads`: Lists and filters institute leads by status or branch.
5. `add_lead_activity`: Records counsellor calls, chat transcripts, or campus visit logs.

### B. Counselling & Scheduling Tools
6. `check_available_slots`: Checks 30-minute counsellor slots for conflict-free booking.
7. `create_appointment`: Books 1-on-1 career counselling appointment.
8. `reschedule_appointment`: Moves an appointment to a new available time slot.
9. `cancel_appointment`: **[High-Impact]** Flags human approval before cancelling booked appointment.

### C. Follow-up Automation Tools
10. `create_followup`: Queues a personalized WhatsApp/SMS follow-up message.
11. `get_pending_followups`: Retrieves tasks awaiting counselor approval.
12. `update_followup_status`: Counselor marks follow-up as `APPROVED`, `SENT`, or `REJECTED`.

### D. Knowledge & RAG Tools
13. `search_institute_knowledge`: Semantic & keyword hybrid vector search against official prospectus chunks.
14. `get_course_information`: Returns verified courses and descriptions.
15. `get_fee_information`: Returns zero-hallucination base fees, installment breakdown, and scholarship rules.
16. `get_batch_information`: Returns upcoming batch dates, timings, days, and enrolled seats.

### E. Analytics Tools
17. `get_admission_statistics`: Real-time pipeline metrics and conversion rate percentage.
18. `get_lead_conversion_report`: Funnel report segmented by acquisition source.
19. `get_branch_performance`: Head-to-head comparison between Kota, Jaipur, Delhi branches.

### F. Google Calendar Tools
20. `calendar_list_events`: Lists upcoming calendar events.
21. `calendar_check_availability`: Checks conflict against counsellor calendar.
22. `calendar_create_event`: Creates appointment with Google Meet conference link.
23. `calendar_update_event`: Updates event timings or summary.
24. `calendar_cancel_event`: **[High-Impact]** Cancels calendar event with confirmation flag.

### G. WhatsApp Business Cloud API Tools
25. `whatsapp_get_templates`: Fetches Meta-approved templates.
26. `whatsapp_prepare_message`: Validates parameters (`{{1}}`, `{{2}}`, etc.) against approved schema.
27. `whatsapp_send_approved_template`: Sends WhatsApp notification with **strict opt-in consent verification**.
28. `whatsapp_get_message_status`: Queries delivery and read receipts.

### H. Student Document Workflow Tools
29. `list_student_documents`: Lists submitted application documents.
30. `get_document_status`: Retrieves verification status for a document.
31. `check_application_completeness`: Calculates missing documents and percentage readiness.
32. `request_missing_document`: Automatically queues a document upload reminder follow-up.
33. `update_document_review_status`: Staff review action to mark document as `VERIFIED` or `REJECTED`.

---

## 4. MCP Security & Tenant Isolation Guarantees

1. **Server-Side Tenant Derivation**: The AI model is **never allowed** to supply or override `institute_id`. The server strictly derives `institute_id` from the authenticated session context.
2. **Role-Based Tool Gating**:
   * `STUDENT`: Read-only course enquiries, slot checking, application file review.
   * `COUNSELLOR`: Lead updates, appointment creation, follow-up approval queue.
   * `ADMIN`: Branch analytics, integration settings, system logs.
3. **High-Impact Human-In-The-Loop**: Destructive or critical operations (e.g. `cancel_appointment`) flag `requiresHumanApproval: true` before permanent changes are applied.
4. **Idempotency**: Every mutating tool call supports an `x-request-id` header to cache responses and eliminate duplicate API calls.
5. **Rate Limiting**: Protected with a 120 req/min sliding-window limiter.
