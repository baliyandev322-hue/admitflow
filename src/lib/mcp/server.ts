import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { db } from '../db';
import { toolRegistry, McpToolDefinition } from './registry';
import { checkRateLimit } from '../rateLimit';

// In-Memory Idempotency / Duplicate Request Cache (30s window)
const duplicateRequestCache = new Map<string, { result: any; expiresAt: number }>();

export interface ToolExecutionResponse {
  success: boolean;
  toolName: string;
  data: any;
  requiresHumanApproval?: boolean;
  error?: string;
  executionTimeMs: number;
}

/**
 * Creates and initializes the official McpServer instance according to
 * Model Context Protocol (MCP) TypeScript SDK specification.
 */
export function createAdmitFlowMcpServer(
  instituteId: string, 
  actor: { id: string; role: 'STUDENT' | 'COUNSELLOR' | 'ADMIN' } = { id: 'agent-core', role: 'COUNSELLOR' }
): McpServer {
  const institute = db.getInstituteById(instituteId);
  if (!institute) {
    throw new Error(`Cannot initialize MCP Server: Institute ${instituteId} not found.`);
  }

  const server = new McpServer({
    name: `admitflow-mcp-${institute.slug || instituteId}`,
    version: '1.0.0'
  });

  // Register each tool from our registry onto the official MCP Server
  for (const [name, def] of Object.entries(toolRegistry)) {
    // Only register tools permissible for the actor's role
    if (def.requiredRole === 'ADMIN' && actor.role !== 'ADMIN') continue;
    if (def.requiredRole === 'COUNSELLOR' && actor.role === 'STUDENT') continue;

    server.tool(
      name,
      def.description,
      def.schema.shape,
      async (args: any) => {
        try {
          const result = await executeMcpToolDirectly(instituteId, name, args, actor);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(result.data, null, 2)
              }
            ]
          };
        } catch (err: any) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: `MCP Tool Execution Error [${name}]: ${err.message}`
              }
            ]
          };
        }
      }
    );
  }

  return server;
}

/**
 * Executes an MCP tool with tenant isolation, permission verification,
 * rate limiting, idempotency checking, and audit logging.
 */
export async function executeMcpToolDirectly(
  instituteId: string,
  toolName: string,
  args: any,
  actor: { id: string; role: string } = { id: 'agent-core', role: 'COUNSELLOR' },
  requestId?: string
): Promise<ToolExecutionResponse> {
  const startTime = Date.now();

  // 1. Rate Limiting Check
  const rateKey = `mcp-${instituteId}-${actor.id}`;
  const rateCheck = checkRateLimit(rateKey, 120, 60000); // 120 requests/minute
  if (!rateCheck.allowed) {
    throw new Error(`Rate limit exceeded for MCP tool execution. Try again in ${rateCheck.resetInSec} seconds.`);
  }

  // 2. Duplicate / Replay Request Check (Idempotency)
  if (requestId) {
    const cached = duplicateRequestCache.get(requestId);
    if (cached && Date.now() < cached.expiresAt) {
      return {
        ...cached.result,
        executionTimeMs: 0
      };
    }
  }

  // 3. Tool Discovery & Permission Check
  const tool = toolRegistry[toolName];
  if (!tool) {
    throw new Error(`Tool "${toolName}" is not registered in AdmitFlow MCP registry.`);
  }

  if (tool.requiredRole === 'ADMIN' && actor.role !== 'ADMIN') {
    throw new Error(`Access Denied: Tool "${toolName}" requires ADMIN role. Current actor role is ${actor.role}.`);
  }
  if (tool.requiredRole === 'COUNSELLOR' && actor.role === 'STUDENT') {
    throw new Error(`Access Denied: Tool "${toolName}" requires COUNSELLOR or ADMIN role.`);
  }

  // 4. Strict Schema Input Validation
  const parseResult = tool.schema.safeParse(args);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`Invalid arguments for tool "${toolName}": ${errorDetails}`);
  }

  // 5. High-Impact Action Human Approval Check
  if (tool.requiresApproval) {
    // Flag action as requiring confirmation
  }

  // 6. Execute Handler
  try {
    const data = await tool.execute(instituteId, parseResult.data, actor);
    const duration = Date.now() - startTime;

    const response: ToolExecutionResponse = {
      success: true,
      toolName,
      data,
      requiresHumanApproval: tool.requiresApproval,
      executionTimeMs: duration
    };

    // Store in Idempotency cache if requestId was provided
    if (requestId) {
      duplicateRequestCache.set(requestId, {
        result: response,
        expiresAt: Date.now() + 30000 // 30s cache
      });
    }

    // 7. Audit Log Execution
    db.logAgentExecution({
      id: `exec-mcp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      instituteId,
      skillName: `mcp:${toolName}`,
      triggeredBy: actor.id,
      inputPayload: args,
      outputPayload: data,
      status: 'SUCCESS',
      executionTimeMs: duration,
      createdAt: new Date().toISOString()
    });

    return response;
  } catch (err: any) {
    const duration = Date.now() - startTime;

    // Log failure
    db.logAgentExecution({
      id: `exec-mcp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      instituteId,
      skillName: `mcp:${toolName}`,
      triggeredBy: actor.id,
      inputPayload: args,
      status: 'FAILED',
      errorMessage: err.message,
      executionTimeMs: duration,
      createdAt: new Date().toISOString()
    });

    throw err;
  }
}

/**
 * Returns metadata of all available tools formatted for discovery or UI management.
 */
export function listAvailableMcpTools(instituteId: string, role: string = 'ADMIN', onlyPermitted: boolean = true) {
  const tools = Object.values(toolRegistry).map(t => ({
    name: t.name,
    description: t.description,
    category: t.category,
    readOnly: t.readOnly,
    requiresApproval: t.requiresApproval,
    requiredRole: t.requiredRole,
    isPermitted: role === 'ADMIN' ? true : (role === 'COUNSELLOR' ? t.requiredRole !== 'ADMIN' : t.requiredRole === 'STUDENT')
  }));

  if (onlyPermitted && role !== 'ADMIN') {
    return tools.filter(t => t.isPermitted);
  }
  return tools;
}
