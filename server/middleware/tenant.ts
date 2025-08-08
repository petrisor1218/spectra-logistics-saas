import { Request, Response, NextFunction } from 'express';
import 'express-session';

// Extend Express Request interface to include tenantId
declare global {
  namespace Express {
    interface Request {
      tenantId?: number;
    }
    
    interface SessionData {
      userId?: number;
    }
  }
}

// Middleware pentru izolarea automată de tenanti
export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  // Extract tenant ID from URL path: /api/tenant/:tenantId/...
  const tenantMatch = req.path.match(/^\/api\/tenant\/(\d+)\//);
  
  if (tenantMatch) {
    const tenantId = parseInt(tenantMatch[1], 10);
    
    if (!tenantId || tenantId < 1) {
      return res.status(400).json({ error: 'Invalid tenant ID' });
    }
    
    // Attach tenant ID to request for use in storage layer
    req.tenantId = tenantId;
    console.log(`🏢 Tenant request for tenant ${tenantId}: ${req.method} ${req.path}`);
  } else if (req.path.startsWith('/api/tenant/')) {
    // If path starts with /api/tenant/ but doesn't match pattern, it's invalid
    return res.status(400).json({ error: 'Invalid tenant API path format. Use: /api/tenant/{tenantId}/...' });
  } else {
    // For non-tenant routes (legacy routes), use default tenant 1
    req.tenantId = 1;
  }
  
  next();
}

// Authentication middleware with tenant support
export function requireTenantAuth(req: any, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // TODO: Add tenant authorization check here
  // Verify that the authenticated user has access to the requested tenant
  // For now, we'll allow all authenticated users to access any tenant
  
  next();
}