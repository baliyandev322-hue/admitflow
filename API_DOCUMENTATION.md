# AdmitFlow AI — API Documentation (REST & MCP JSON-RPC 2.0)

AdmitFlow AI exposes both standard **RESTful endpoints** for the web application and an **MCP JSON-RPC 2.0 endpoint** for AI agents.

---

## 1. Model Context Protocol Endpoint

### `GET /api/mcp`
Returns server capabilities, protocol version, and the full registry of available tools filtered by the caller's role.

**Headers:**
* `Authorization: Bearer <token>` or `x-institute-id: <instituteId>`

**Response:**
```json
{
  "name": "admitflow-mcp-apex-academy",
  "protocolVersion": "2024-11-05",
  "sdkVersion": "1.32.2",
  "transport": "streamable-http",
  "institute": { "id": "inst-apex-001", "name": "Apex Academy (IIT-JEE & NEET)" },
  "toolsCount": 33,
  "tools": [
    {
      "name": "get_fee_information",
      "description": "Get ground-truth base fees...",
      "category": "KNOWLEDGE",
      "readOnly": true,
      "requiresApproval": false,
      "isPermitted": true
    }
  ]
}
```

---

### `POST /api/mcp`
Standard JSON-RPC 2.0 execution endpoint.

#### A. Initialize Protocol
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "initialize",
  "params": {}
}
```

#### B. List Tools (`tools/list`)
```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "method": "tools/list"
}
```

#### C. Execute Tool (`tools/call`)
```json
{
  "jsonrpc": "2.0",
  "id": "3",
  "method": "tools/call",
  "params": {
    "name": "get_fee_information",
    "arguments": {
      "courseNameOrCode": "jee"
    }
  }
}
```

---

## 2. Core REST API Endpoints

### Authentication
* `POST /api/auth/register`: Onboard new institute and create owner account.
* `POST /api/auth/login`: Authenticate user and receive 7-day JWT token.
* `GET /api/auth/me`: Fetch authenticated session and institute context.

### Lead CRM & Activities
* `GET /api/leads`: List institute leads with filtering by stage, branch, and score.
* `POST /api/leads`: Create new student enquiry lead.
* `GET /api/leads/[id]/activity`: Retrieve chronological timeline of student interactions.
* `GET /api/leads/[id]/next-action`: Prescribe Next Best Action from AI agent.

### Knowledge Brain (RAG)
* `GET /api/rag/documents`: List uploaded knowledge documents and chunking metrics.
* `POST /api/rag/upload`: Upload prospectus PDF/text, chunk into 350-word passages, and index embeddings.

### Chat & Conversational AI
* `POST /api/chat`: Grounded chat endpoint with rate limiting, RAG context retrieval, and live Gemini AI generation.

### Integrations & External Connectors
* `GET /api/integrations`: Retrieve status of Google Calendar, WhatsApp, and MCP runtime.
* `POST /api/integrations`: Toggle connector status and update configuration.
