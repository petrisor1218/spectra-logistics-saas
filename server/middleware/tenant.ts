import { Request, Response, NextFunction } from "express";
import { TenantManager } from "../tenant-manager.js";

// Extinde Request pentru a include informații despre tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: any;
      tenantDb?: any;
    }
  }
}

export interface TenantRequest extends Request {
  tenant?: any;
  tenantDb?: any;
}

// Middleware pentru detectarea tenantului din subdomain
export const tenantMiddleware = async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const host = req.get("host");
    const subdomain = extractSubdomain(host);
    
    if (!subdomain || subdomain === "www" || subdomain === "admin") {
      // Rute pentru admin sau landing page
      return next();
    }
    
    // Găsește tenantul după subdomain
    const tenant = await TenantManager.getTenantBySubdomain(subdomain);
    
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    
    // Verifică dacă tenantul este activ
    if (tenant.status !== "active" && tenant.status !== "trial") {
      return res.status(403).json({ 
        error: "Tenant is not active",
        status: tenant.status 
      });
    }
    
    // Verifică dacă perioada de trial a expirat
    if (tenant.status === "trial" && tenant.trialEndsAt && new Date() > tenant.trialEndsAt) {
      return res.status(402).json({ 
        error: "Trial period expired",
        trialEndsAt: tenant.trialEndsAt 
      });
    }
    
    // Obține baza de date pentru tenant
    const tenantDb = await TenantManager.getTenantDatabase(tenant.id);
    
    // Adaugă informațiile despre tenant la request
    req.tenant = tenant;
    req.tenantDb = tenantDb;
    
    // Log activitatea
    await logTenantActivity(tenant.id, req.path, req.ip, req.get("user-agent"));
    
    next();
  } catch (error) {
    console.error("Tenant middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Middleware pentru rutele care necesită autentificare
export const requireAuth = async (req: TenantRequest, res: Response, next: NextFunction) => {
  if (!req.tenant) {
    return res.status(400).json({ error: "Tenant context required" });
  }
  
  // Aici ar trebui să verifici sesiunea utilizatorului
  // Pentru moment, vom presupune că utilizatorul este autentificat
  
  next();
};

// Middleware pentru rutele admin
export const requireAdmin = async (req: TenantRequest, res: Response, next: NextFunction) => {
  if (!req.tenant) {
    return res.status(400).json({ error: "Tenant context required" });
  }
  
  // Verifică dacă utilizatorul este admin
  // Aici ar trebui să verifici rolul utilizatorului din sesiune
  
  next();
};

// Middleware pentru super admin (acces la toate tenantii)
export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // Verifică dacă utilizatorul este super admin
  // Aici ar trebui să verifici rolul din sesiune
  
  next();
};

// Funcție pentru extragerea subdomain-ului din host
function extractSubdomain(host: string | undefined): string | null {
  if (!host) return null;
  
  // Elimină portul dacă există
  const hostname = host.split(":")[0];
  
  // Verifică dacă este localhost sau IP
  if (hostname === "localhost" || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return null;
  }
  
  const parts = hostname.split(".");
  
  // Dacă avem cel puțin 2 părți (subdomain.domain)
  if (parts.length >= 2) {
    return parts[0];
  }
  
  return null;
}

// Funcție pentru logarea activității tenantului
async function logTenantActivity(tenantId: number, path: string, ipAddress: string, userAgent: string | undefined) {
  try {
    const { secondaryDb } = await import("../db-secondary.js");
    const { tenantActivityLogs } = await import("../../shared/schema-secondary.js");
    
    await secondaryDb.insert(tenantActivityLogs).values({
      tenantId,
      action: "api_call",
      details: { path },
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Error logging tenant activity:", error);
  }
}

// Funcție pentru obținerea tenantului din request
export function getTenantFromRequest(req: TenantRequest) {
  if (!req.tenant) {
    throw new Error("Tenant not found in request context");
  }
  return req.tenant;
}

// Funcție pentru obținerea bazei de date a tenantului din request
export function getTenantDbFromRequest(req: TenantRequest) {
  if (!req.tenantDb) {
    throw new Error("Tenant database not found in request context");
  }
  return req.tenantDb;
}