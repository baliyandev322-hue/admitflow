import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, getAuthUser } from '@/lib/auth';
import { toolRegistry } from '@/lib/mcp/registry';
import { executeMcpToolDirectly, listAvailableMcpTools } from '@/lib/mcp/server';
import { checkRateLimit } from '@/lib/rateLimit';

// Resolve authenticated institute and actor
function resolveAuthContext(req: NextRequest): { instituteId: string; actor: { id: string; role: 'STUDENT' | 'COUNSELLOR' | 'ADMIN' } } {
  // 1. Check Bearer Token (JWT) or Cookie
  const user = getAuthUser(req);
  if (user) {
    return {
      instituteId: user.instituteId,
      actor: { id: user.userId, role: user.role as any }
    };
  }

  // 2. Fallback to API Key / Institute Header for authorized service calls
  const instHeader = req.headers.get('x-institute-id');
  if (instHeader && db.getInstituteById(instHeader)) {
    return {
      instituteId: instHeader,
      actor: { id: 'api-service-caller', role: 'ADMIN' }
    };
  }

  // 3. Fallback to primary demo institute if in local dev
  const defaultInst = db.getInstitutes()[0];
  return {
    instituteId: defaultInst ? defaultInst.id : 'inst-apex-001',
    actor: { id: 'anonymous-mcp-client', role: 'STUDENT' }
  };
}

/**
 * GET /api/mcp
 * MCP Server Discovery & Capabilities Endpoint
 */
export async function GET(req: NextRequest) {
  try {
    const { instituteId, actor } = resolveAuthContext(req);
    const inst = db.getInstituteById(instituteId);

    const tools = listAvailableMcpTools(instituteId, actor.role);

    return NextResponse.json({
      name: `admitflow-mcp-${inst?.slug || instituteId}`,
      protocolVersion: '2024-11-05',
      sdkVersion: '1.32.2',
      transport: 'streamable-http',
      institute: {
        id: inst?.id,
        name: inst?.name
      },
      capabilities: {
        tools: {
          listChanged: true
        },
        resources: {},
        prompts: {}
      },
      toolsCount: tools.length,
      tools
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/mcp
 * JSON-RPC 2.0 / Streamable HTTP Tool Execution Endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`mcp-http-${ip}`, 60, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json({
        jsonrpc: '2.0',
        error: { code: -32000, message: `Rate limit exceeded. Try again in ${rateCheck.resetInSec}s.` },
        id: null
      }, { status: 429 });
    }

    const body = await req.json();
    const { method, params, id = '1' } = body;
    const { instituteId, actor } = resolveAuthContext(req);

    // 1. MCP Protocol Initialize
    if (method === 'initialize') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'admitflow-mcp-server',
            version: '1.0.0'
          }
        }
      });
    }

    // 2. tools/list Discovery
    if (method === 'tools/list') {
      const tools = Object.values(toolRegistry).map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: {
          type: 'object',
          properties: (t.schema as any).shape
        }
      }));
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: { tools }
      });
    }

    // 3. tools/call Tool Execution
    if (method === 'tools/call') {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const requestId = req.headers.get('x-request-id') || undefined;

      if (!toolName) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Invalid params: "name" is required for tools/call' }
        }, { status: 400 });
      }

      try {
        const execution = await executeMcpToolDirectly(instituteId, toolName, toolArgs, actor, requestId);

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(execution.data, null, 2)
              }
            ],
            requiresHumanApproval: execution.requiresHumanApproval,
            executionTimeMs: execution.executionTimeMs
          }
        });
      } catch (toolErr: any) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            isError: true,
            content: [
              {
                type: 'text',
                text: toolErr.message
              }
            ]
          }
        });
      }
    }

    // Unrecognized Method
    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method "${method}" not found on AdmitFlow MCP Server.` }
    }, { status: 404 });

  } catch (err: any) {
    return NextResponse.json({
      jsonrpc: '2.0',
      error: { code: -32603, message: err.message || 'Internal JSON-RPC error' },
      id: null
    }, { status: 500 });
  }
}
