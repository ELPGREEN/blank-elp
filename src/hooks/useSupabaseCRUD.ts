import { supabase } from "@/integrations/supabase/client";

export type TableName = string;

export interface CRUDResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Generic CRUD operations for Supabase tables
 * Equivalent to the Python supabase_integration.py script
 */
export function useSupabaseCRUD() {
  
  /**
   * SELECT rows from a table
   * @param table - Table name
   * @param select - Fields to select (default "*")
   * @param limit - Optional limit
   * @param filters - Optional equality filters { column: value }
   */
  async function fetchRows<T = Record<string, unknown>>(
    table: string,
    options?: {
      select?: string;
      limit?: number;
      filters?: Record<string, unknown>;
    }
  ): Promise<CRUDResponse<T[]>> {
    try {
      const { select = "*", limit, filters } = options || {};
      
      let query = supabase.from(table as any).select(select);
      
      if (filters) {
        Object.entries(filters).forEach(([col, val]) => {
          query = query.eq(col, val as any);
        });
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data as T[], error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  /**
   * INSERT a single row and return inserted row
   * @param table - Table name
   * @param payload - Object to insert
   */
  async function insertRow<T = Record<string, unknown>>(
    table: string,
    payload: Record<string, unknown>
  ): Promise<CRUDResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(table as any)
        .insert(payload as any)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data as T, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  /**
   * UPDATE rows matching filters with changes
   * @param table - Table name
   * @param match - Equality filters to match rows
   * @param changes - Fields to update
   */
  async function updateRow<T = Record<string, unknown>>(
    table: string,
    match: Record<string, unknown>,
    changes: Record<string, unknown>
  ): Promise<CRUDResponse<T[]>> {
    try {
      let query = supabase.from(table as any).update(changes as any);
      
      Object.entries(match).forEach(([col, val]) => {
        query = query.eq(col, val as any);
      });
      
      const { data, error } = await query.select();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data as T[], error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  /**
   * DELETE rows matching filters
   * @param table - Table name
   * @param match - Equality filters to match rows
   */
  async function deleteRow<T = Record<string, unknown>>(
    table: string,
    match: Record<string, unknown>
  ): Promise<CRUDResponse<T[]>> {
    try {
      let query = supabase.from(table as any).delete();
      
      Object.entries(match).forEach(([col, val]) => {
        query = query.eq(col, val as any);
      });
      
      const { data, error } = await query.select();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data as T[], error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  /**
   * Call a Postgres RPC function
   * @param functionName - Name of the function
   * @param params - Parameters to pass
   */
  async function rpc<T = unknown>(
    functionName: string,
    params?: Record<string, unknown>
  ): Promise<CRUDResponse<T>> {
    try {
      const { data, error } = await supabase.rpc(functionName as any, params || {});
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data as T, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  /**
   * Upsert (insert or update) a row
   * @param table - Table name
   * @param payload - Object to upsert
   * @param onConflict - Column(s) to check for conflict
   */
  async function upsertRow<T = Record<string, unknown>>(
    table: string,
    payload: Record<string, unknown>,
    onConflict?: string
  ): Promise<CRUDResponse<T>> {
    try {
      const options = onConflict ? { onConflict } : undefined;
      
      const { data, error } = await supabase
        .from(table as any)
        .upsert(payload as any, options)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data as T, error: null };
    } catch (err) {
      return { data: null, error: String(err) };
    }
  }

  return {
    fetchRows,
    insertRow,
    updateRow,
    deleteRow,
    upsertRow,
    rpc,
  };
}

// Standalone functions for use outside React components
export const supabaseCRUD = {
  async fetchRows<T = Record<string, unknown>>(
    table: string,
    options?: { select?: string; limit?: number; filters?: Record<string, unknown> }
  ) {
    const { select = "*", limit, filters } = options || {};
    let query = supabase.from(table as any).select(select);
    
    if (filters) {
      Object.entries(filters).forEach(([col, val]) => {
        query = query.eq(col, val as any);
      });
    }
    if (limit) query = query.limit(limit);
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as T[];
  },

  async insertRow<T = Record<string, unknown>>(table: string, payload: Record<string, unknown>) {
    const { data, error } = await supabase.from(table as any).insert(payload as any).select().single();
    if (error) throw new Error(error.message);
    return data as T;
  },

  async updateRow<T = Record<string, unknown>>(
    table: string,
    match: Record<string, unknown>,
    changes: Record<string, unknown>
  ) {
    let query = supabase.from(table as any).update(changes as any);
    Object.entries(match).forEach(([col, val]) => {
      query = query.eq(col, val as any);
    });
    const { data, error } = await query.select();
    if (error) throw new Error(error.message);
    return data as T[];
  },

  async deleteRow<T = Record<string, unknown>>(table: string, match: Record<string, unknown>) {
    let query = supabase.from(table as any).delete();
    Object.entries(match).forEach(([col, val]) => {
      query = query.eq(col, val as any);
    });
    const { data, error } = await query.select();
    if (error) throw new Error(error.message);
    return data as T[];
  },

  async rpc<T = unknown>(functionName: string, params?: Record<string, unknown>) {
    const { data, error } = await supabase.rpc(functionName as any, params || {});
    if (error) throw new Error(error.message);
    return data as T;
  },
};
