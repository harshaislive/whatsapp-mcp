#!/usr/bin/env node

// Simple test script to verify HTTP MCP transport is working
// This simulates what an MCP client would do

const BASE_URL = 'http://localhost:3000/mcp';

async function testHttpTransport() {
  console.log('Testing MCP HTTP Transport...');
  
  try {
    // Test 1: Send initialization request
    console.log('\n1. Testing initialization request...');
    const initResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        }
      })
    });
    
    if (!initResponse.ok) {
      throw new Error(`HTTP ${initResponse.status}: ${initResponse.statusText}`);
    }
    
    const sessionId = initResponse.headers.get('Mcp-Session-Id');
    console.log(`✓ Initialization successful! Session ID: ${sessionId}`);
    
    if (!sessionId) {
      throw new Error('No session ID returned');
    }
    
    // Test 2: List tools request
    console.log('\n2. Testing tools/list request...');
    const toolsResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Mcp-Session-Id': sessionId
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      })
    });
    
    if (!toolsResponse.ok) {
      throw new Error(`HTTP ${toolsResponse.status}: ${toolsResponse.statusText}`);
    }
    
    const toolsData = await toolsResponse.json();
    console.log(`✓ Tools list successful! Found ${toolsData.result?.tools?.length || 0} tools`);
    console.log('Available tools:', toolsData.result?.tools?.map(t => t.name) || []);
    
    // Test 3: Server capabilities
    console.log('\n3. Testing server info...');
    const serverResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Mcp-Session-Id': sessionId
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'ping'
      })
    });
    
    if (serverResponse.ok) {
      const serverData = await serverResponse.json();
      console.log('✓ Server is responding to requests');
    }
    
    console.log('\n✅ HTTP Transport test completed successfully!');
    console.log('\nServer is ready for MCP clients. You can connect using:');
    console.log(`URL: ${BASE_URL}`);
    console.log('Method: Streamable HTTP (MCP 2024-11-05)');
    
  } catch (error) {
    console.error('\n❌ HTTP Transport test failed:', error.message);
    process.exit(1);
  }
}

// Wait a bit for server to start, then test
setTimeout(testHttpTransport, 2000);