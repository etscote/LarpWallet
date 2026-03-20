cat > functions/auth.js << 'EOF'
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { serialKey } = await request.json();
    
    if (!env.DB) {
      return new Response(JSON.stringify({ success: false, error: 'DB not bound' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await env.DB.prepare(
      'SELECT * FROM serial_keys WHERE key = ? AND is_active = 1'
    ).bind(serialKey).first();
    
    if (result) {
      const sessionToken = crypto.randomUUID();
      
      await env.DB.prepare(
        'INSERT INTO sessions (token, serial_key_id, created_at) VALUES (?, ?, datetime("now"))'
      ).bind(sessionToken, result.id).run();
      
      return new Response(JSON.stringify({ 
        success: true, 
        token: sessionToken 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ success: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(JSON.stringify({ valid: false }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!env.DB) {
      return new Response(JSON.stringify({ valid: false, error: 'DB not bound' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const session = await env.DB.prepare(
      'SELECT s.* FROM sessions s JOIN serial_keys k ON s.serial_key_id = k.id WHERE s.token = ? AND k.is_active = 1'
    ).bind(token).first();
    
    if (session) {
      return new Response(JSON.stringify({ valid: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ valid: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ valid: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
EOF

//allo