import { supabase } from '@/api/supabase';
import { applyOrder } from '@/api/entity';

/**
 * User entity — wraps Supabase Auth + profiles table.
 * Replaces Base44's base44.auth with equivalent methods.
 */
export const User = {
  /**
   * Get the currently logged-in user (equivalent to Base44 User.me())
   */
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('User not authenticated');
    
    // Fetch profile data from users table
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || '';
    // Spread profile first so explicit fields below take precedence over raw DB values.
    return {
      ...profile,
      id: profile?.id || user.id,
      auth_id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || '',
      role: profile?.role || 'user',
      avatar_url: avatarUrl,
    };
  },

  /**
   * Login with Google OAuth
   */
  async login() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  },

  /**
   * Register with email + password
   */
  async register(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  },

  /**
   * Login with email + password
   */
  async loginWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  /**
   * Send password reset email
   */
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    if (error) throw error;
  },

  /**
   * Logout (equivalent to Base44 User.logout())
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * List all users (equivalent to Base44 User.list())
   */
  async list(orderBy) {
    let query = supabase.from('users').select('*');
    query = applyOrder(query, orderBy, null);

    const { data, error } = await query;
    if (error) throw new Error(`Error listing users: ${error.message}`);
    return data || [];
  },

  /**
   * Filter users
   */
  async filter(filters, orderBy, limit) {
    let query = supabase.from('users').select('*');

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    query = applyOrder(query, orderBy, null);
    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw new Error(`Error filtering users: ${error.message}`);
    return data || [];
  },

  /**
   * Update a user record
   */
  async update(id, data) {
    const { data: record, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`Error updating user: ${error.message}`);
    return record;
  },

  /**
   * Delete a user record
   */
  async delete(id) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`Error deleting user: ${error.message}`);
    return true;
  }
};
