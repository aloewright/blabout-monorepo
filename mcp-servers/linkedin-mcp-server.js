#!/usr/bin/env node
/**
 * Custom LinkedIn MCP Server
 * Uses LinkedIn access token for direct API calls
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

const server = new Server(
  {
    name: 'linkedin-custom-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// LinkedIn API base URL
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

// Get access token from environment
const ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('LINKEDIN_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}

// Helper function to make LinkedIn API requests
async function linkedinApiRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0'
  };

  const config = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${LINKEDIN_API_BASE}${endpoint}`, config);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LinkedIn API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_linkedin_profile',
        description: 'Get your own LinkedIn profile information',
        inputSchema: {
          type: 'object',
          properties: {
            fields: {
              type: 'string',
              description: 'Comma-separated list of fields to retrieve (optional)',
              default: 'id,firstName,lastName,headline,profilePicture'
            }
          }
        },
      },
      {
        name: 'search_linkedin_people',
        description: 'Search for people on LinkedIn',
        inputSchema: {
          type: 'object',
          properties: {
            keywords: {
              type: 'string',
              description: 'Search keywords',
              required: true
            },
            start: {
              type: 'number',
              description: 'Start index (default: 0)',
              default: 0
            },
            count: {
              type: 'number',
              description: 'Number of results (default: 10, max: 50)',
              default: 10
            }
          },
          required: ['keywords']
        },
      },
      {
        name: 'get_linkedin_companies',
        description: 'Search for companies on LinkedIn',
        inputSchema: {
          type: 'object',
          properties: {
            keywords: {
              type: 'string',
              description: 'Company search keywords',
              required: true
            },
            start: {
              type: 'number',
              description: 'Start index (default: 0)',
              default: 0
            },
            count: {
              type: 'number',
              description: 'Number of results (default: 10)',
              default: 10
            }
          },
          required: ['keywords']
        },
      },
      {
        name: 'create_linkedin_post',
        description: 'Create a post on LinkedIn',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Post content text',
              required: true
            },
            visibility: {
              type: 'string',
              description: 'Post visibility (PUBLIC or CONNECTIONS)',
              default: 'PUBLIC',
              enum: ['PUBLIC', 'CONNECTIONS']
            }
          },
          required: ['text']
        },
      },
      {
        name: 'get_linkedin_activity',
        description: 'Get your LinkedIn activity feed',
        inputSchema: {
          type: 'object',
          properties: {
            count: {
              type: 'number',
              description: 'Number of activities to retrieve (default: 20)',
              default: 20
            }
          }
        },
      }
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_linkedin_profile':
        const fields = args.fields || 'id,firstName,lastName,headline,profilePicture';
        const profile = await linkedinApiRequest(`/people/~?projection=(${fields})`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(profile, null, 2),
            },
          ],
        };

      case 'search_linkedin_people':
        const peopleSearch = await linkedinApiRequest(
          `/peopleSearch?keywords=${encodeURIComponent(args.keywords)}&start=${args.start || 0}&count=${Math.min(args.count || 10, 50)}`
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(peopleSearch, null, 2),
            },
          ],
        };

      case 'get_linkedin_companies':
        const companySearch = await linkedinApiRequest(
          `/companySearch?keywords=${encodeURIComponent(args.keywords)}&start=${args.start || 0}&count=${args.count || 10}`
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(companySearch, null, 2),
            },
          ],
        };

      case 'create_linkedin_post':
        const postData = {
          author: 'urn:li:person:' + (await linkedinApiRequest('/people/~?projection=(id)')).id,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: args.text
              },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': args.visibility || 'PUBLIC'
          }
        };

        const post = await linkedinApiRequest('/ugcPosts', 'POST', postData);
        return {
          content: [
            {
              type: 'text',
              text: `Post created successfully: ${JSON.stringify(post, null, 2)}`,
            },
          ],
        };

      case 'get_linkedin_activity':
        const activity = await linkedinApiRequest(
          `/shares?q=owners&owners=urn:li:person:${(await linkedinApiRequest('/people/~?projection=(id)')).id}&count=${args.count || 20}&sortBy=LAST_MODIFIED`
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(activity, null, 2),
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('LinkedIn MCP server running on stdio');
}

main().catch(console.error);
