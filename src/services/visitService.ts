import { supabase } from '@/lib/supabase';
import { SiteVisit } from '@/types';

export const VisitService = {
  async getAll(): Promise<SiteVisit[]> {
    const { data, error } = await supabase
      .from('site_visits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message.includes('relation "public.site_visits" does not exist')) {
        return []; // Fallback gracefully if table not created yet
      }
      throw new Error(\`Falha ao buscar visitas: \${error.message}\`);
    }

    return (data || []).map(this.mapFromDb);
  },

  async save(visit: SiteVisit): Promise<SiteVisit> {
    const isNew = !visit.id.startsWith('vis-') && !visit.id.includes('-'); // Rough check for temp vs real uuid

    const payload: any = {
      number: visit.number,
      client_name: visit.clientName,
      client_phone: visit.clientPhone,
      client_address: visit.clientAddress,
      client_email: visit.clientEmail,
      client_nif: visit.clientNif,
      checklist: visit.checklist,
      visit_date: visit.visitDate,
      responsible: visit.responsible,
      project_types: visit.projectTypes,
      technical_notes: visit.technicalNotes,
      measurements_data: visit.measurementsData,
      status: visit.status,
    };

    if (!isNew) {
      payload.id = visit.id;
    }

    const { data, error } = await supabase
      .from('site_visits')
      .upsert(payload)
      .select('*')
      .single();

    if (error) throw new Error(\`Falha ao guardar visita: \${error.message}\`);
    
    return this.mapFromDb(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('site_visits')
      .delete()
      .eq('id', id);

    if (error) throw new Error(\`Falha ao apagar visita: \${error.message}\`);
  },

  mapFromDb(row: any): SiteVisit {
    return {
      id: row.id,
      number: row.number,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      clientAddress: row.client_address,
      clientEmail: row.client_email,
      clientNif: row.client_nif,
      checklist: row.checklist || {},
      visitDate: row.visit_date,
      responsible: row.responsible,
      projectTypes: row.project_types || [],
      technicalNotes: row.technical_notes,
      measurementsData: row.measurements_data,
      status: row.status,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
};
