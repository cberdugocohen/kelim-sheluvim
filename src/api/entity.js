import { supabase } from './supabase';

/**
 * Base entity class that provides CRUD operations matching the Base44 SDK API.
 * Each entity maps to a Supabase table with the same methods:
 *   - Entity.create(data)
 *   - Entity.update(id, data)
 *   - Entity.delete(id)
 *   - Entity.get(id)
 *   - Entity.list(orderBy, limit)
 *   - Entity.filter(filters, orderBy, limit)
 */

/**
 * Apply ordering to a Supabase query.
 * orderBy format: "-field" for desc, "field" for asc (matches Base44 convention)
 * defaultField: fallback sort column when no orderBy is given (null = no default)
 */
export function applyOrder(query, orderBy, defaultField = 'created_date') {
  if (orderBy) {
    const desc = orderBy.startsWith('-');
    const field = desc ? orderBy.slice(1) : orderBy;
    return query.order(field, { ascending: !desc });
  }
  if (defaultField) {
    return query.order(defaultField, { ascending: false });
  }
  return query;
}

export function createEntity(tableName) {
  return {
    /**
     * Create a new record
     */
    async create(data) {
      const { data: record, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();
      if (error) throw new Error(`Error creating ${tableName}: ${error.message}`);
      return record;
    },

    /**
     * Update a record by ID
     */
    async update(id, data) {
      const { data: record, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(`Error updating ${tableName}: ${error.message}`);
      return record;
    },

    /**
     * Delete a record by ID
     */
    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw new Error(`Error deleting ${tableName}: ${error.message}`);
      return true;
    },

    /**
     * Get a single record by ID
     */
    async get(id) {
      const { data: record, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw new Error(`Error getting ${tableName}: ${error.message}`);
      return record;
    },

    /**
     * List all records with optional ordering and limit.
     * orderBy format: "-field" for desc, "field" for asc (matches Base44 convention)
     */
    async list(orderBy, limit) {
      let query = supabase.from(tableName).select('*');
      query = applyOrder(query, orderBy);
      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw new Error(`Error listing ${tableName}: ${error.message}`);
      return data || [];
    },

    /**
     * Filter records by criteria.
     * filters: object with key-value pairs for equality matching
     * orderBy: "-field" for desc, "field" for asc
     * limit: max records to return
     */
    async filter(filters, orderBy, limit) {
      let query = supabase.from(tableName).select('*');

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      query = applyOrder(query, orderBy);
      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw new Error(`Error filtering ${tableName}: ${error.message}`);
      return data || [];
    },

    /**
     * Filter records where a field value is IN a list of values.
     * Replaces N+1 queries like: ids.map(id => Entity.filter({ user_id: id }))
     * with a single: Entity.filter_in('user_id', ids)
     */
    async filter_in(field, values, orderBy) {
      if (!values || values.length === 0) return [];

      let query = supabase.from(tableName).select('*').in(field, values);
      query = applyOrder(query, orderBy, null);

      const { data, error } = await query;
      if (error) throw new Error(`Error filter_in ${tableName}: ${error.message}`);
      return data || [];
    }
  };
}
