/**
 * Institution Service
 * Handles institution-centric team manager operations using unified teams + team_members system
 * NO team_managers table dependencies
 */

import { supabase } from '../lib/supabase';
import { InstitutionalProfile, InstitutionFormData, ManagerTransferRequest } from '../types/institution';

/**
 * Get institutional profile for current team manager
 * Uses institutional_profile_view which queries teams + profiles (not team_managers)
 */
export async function getInstitutionalProfile(managerId: string): Promise<InstitutionalProfile | null> {
  try {
    const { data, error } = await supabase
      .from('institutional_profile_view')
      .select('*')
      .eq('id', managerId)
      .single();

    if (error) {
      console.error('Error fetching institutional profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getInstitutionalProfile:', error);
    return null;
  }
}

/**
 * Update institutional profile
 * Updates teams table directly (not team_managers)
 */
export async function updateInstitutionalProfile(
  managerId: string, 
  formData: InstitutionFormData
): Promise<any | null> {
  try {
    const updateData = {
      institution_name: formData.institution_name,
      institution_type: formData.institution_type,
      address: formData.address || null,
      city: formData.city || null,
      state: formData.state || null,
      zip_code: formData.zip_code || null,
      phone: formData.phone || null,
      website: formData.website || null,
      established_year: formData.established_year || null,
      description: formData.description || null,
      manager_title: formData.manager_title,
    };

    // Update teams table where this manager is the creator
    const { data, error } = await supabase
      .from('teams')
      .update(updateData)
      .eq('created_by', managerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating institutional profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateInstitutionalProfile:', error);
    throw error;
  }
}

/**
 * Upload institution logo
 * Updates teams table logo_url (not team_managers)
 */
export async function uploadInstitutionLogo(
  managerId: string, 
  file: File
): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${managerId}-logo.${fileExt}`;
    const filePath = `institution-logos/${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('storage') // Using existing storage bucket
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading logo:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('storage')
      .getPublicUrl(filePath);

    // Update teams table with logo URL (where this manager is creator)
    const { error: updateError } = await supabase
      .from('teams')
      .update({ logo_url: data.publicUrl })
      .eq('created_by', managerId);

    if (updateError) {
      console.error('Error updating logo URL:', updateError);
      throw updateError;
    }

    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadInstitutionLogo:', error);
    throw error;
  }
}

/**
 * Transfer team manager role to another person
 * Uses transfer_team_management function (profiles-based, not team_managers)
 */
export async function transferManagerRole(
  transferRequest: ManagerTransferRequest
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('transfer_team_management', {
      old_manager_id: transferRequest.old_manager_id,
      new_manager_id: transferRequest.new_manager_id
    });

    if (error) {
      console.error('Error transferring manager role:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in transferManagerRole:', error);
    throw error;
  }
}

/**
 * Search for potential new managers by email
 * Uses profiles table directly
 */
export async function searchPotentialManagers(email: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url')
      .eq('email', email.toLowerCase().trim())
      .eq('role', 'team_manager');

    if (error) {
      console.error('Error searching for managers:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchPotentialManagers:', error);
    return [];
  }
}

/**
 * Get institution statistics
 * Uses institutional_profile_view (teams + team_members based)
 */
export async function getInstitutionStats(managerId: string): Promise<{
  teams: number;
  athletes: number;
  coaches: number;
  activeInvites: number;
} | null> {
  try {
    const { data, error } = await supabase
      .from('institutional_profile_view')
      .select('team_count, total_athletes, total_coaches')
      .eq('id', managerId)
      .single();

    if (error) {
      console.error('Error fetching institution stats:', error);
      return null;
    }

    // Get active invites count (using profiles, not team_managers)
    const { count: activeInvites } = await supabase
      .from('team_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('invited_by', managerId)
      .eq('status', 'pending');

    return {
      teams: data.team_count || 0,
      athletes: data.total_athletes || 0,
      coaches: data.total_coaches || 0,
      activeInvites: activeInvites || 0
    };
  } catch (error) {
    console.error('Error in getInstitutionStats:', error);
    return null;
  }
} 