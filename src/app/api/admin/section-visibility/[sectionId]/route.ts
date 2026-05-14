/**
 * API Route: /api/admin/section-visibility/[sectionId]
 * GET: Legge una configurazione di sezione
 * PUT: Aggiorna isActive oppure roleConfig
 * DELETE: Cancella la configurazione (riporta ai default)
 * Richiede: Admin o SuperAdmin
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getSectionVisibility,
  updateSectionActive,
  updateSectionRoleConfig,
  updateSectionVisibility,
} from "@/lib/mongo/visibility";
import type { SectionRoleConfig } from "@/types";

interface RouteParams {
  params: Promise<{
    sectionId: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { sectionId } = await params;
    
    // TODO: Verificare se l'utente è admin o superadmin
    
    const visibility = await getSectionVisibility(sectionId);
    
    if (!visibility) {
      return NextResponse.json(
        { success: false, error: "Sezione non trovata" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: visibility });
  } catch (error) {
    console.error("[GET /api/admin/section-visibility/[sectionId]]", error);
    return NextResponse.json(
      { success: false, error: "Errore nel recupero della sezione" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { sectionId } = await params;
    const body = await req.json();
    
    // TODO: Verificare se l'utente è admin o superadmin
    // TODO: Se l'utente è admin (non superadmin), permettere solo di aggiornare isActive
    
    // Se è una semplice toggling di isActive (admin)
    if (body.isActive !== undefined && body.roleConfig === undefined && body.sectionLabel === undefined) {
      const updated = await updateSectionActive(sectionId, body.isActive);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Sezione non trovata" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: updated });
    }
    
    // Se è una configurazione completa di permessi (superadmin)
    if (body.roleConfig !== undefined) {
      const updated = await updateSectionRoleConfig(sectionId, body.roleConfig as SectionRoleConfig);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Sezione non trovata" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: updated });
    }
    
    // Se è un aggiornamento completo (isActive e/o sectionLabel)
    if (body.sectionLabel !== undefined || body.isActive !== undefined) {
      const updated = await updateSectionVisibility(sectionId, body);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Sezione non trovata" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: updated });
    }
    
    return NextResponse.json(
      { success: false, error: "Nessun aggiornamento fornito" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[PUT /api/admin/section-visibility/[sectionId]]", error);
    return NextResponse.json(
      { success: false, error: "Errore nell'aggiornamento della sezione" },
      { status: 500 }
    );
  }
}
