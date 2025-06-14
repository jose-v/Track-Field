import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@chakra-ui/react';
import {
  UserSettingsComplete,
  UserSettings,
  NotificationPreferences,
  PrivacySettings,
  EmergencyContact,
  MedicalInformation,
  SettingsFormData,
  NotificationFormData,
  PrivacyFormData
} from '../types/settings';

// TODO: REMOVE DUMMY DATA - Replace with real Supabase calls when database is ready
const DUMMY_SETTINGS: UserSettingsComplete = {
  settings: {
    id: 'dummy-settings-1',
    user_id: 'dummy-user-1',
    theme: 'system',
    language: 'en',
    timezone: 'America/New_York',
    units: 'imperial',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  notifications: {
    id: 'dummy-notifications-1',
    user_id: 'dummy-user-1',
    workout_reminders: true,
    meet_updates: true,
    coach_messages: true,
    team_updates: true,
    performance_alerts: false,
    email_notifications: true,
    push_notifications: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  privacy: {
    id: 'dummy-privacy-1',
    user_id: 'dummy-user-1',
    profile_visibility: 'team_only',
    performance_data_visibility: 'coaches_only',
    allow_coach_contact: true,
    allow_team_invites: true,
    share_workout_data: true,
    share_performance_data: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  emergencyContacts: [
    {
      id: 'dummy-emergency-1',
      user_id: 'dummy-user-1',
      name: 'John Doe',
      relationship: 'Parent',
      phone: '+1-555-0123',
      email: 'john.doe@example.com',
      is_primary: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'dummy-emergency-2',
      user_id: 'dummy-user-1',
      name: 'Jane Smith',
      relationship: 'Guardian',
      phone: '+1-555-0456',
      email: 'jane.smith@example.com',
      is_primary: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ],
  medicalInfo: {
    id: 'dummy-medical-1',
    user_id: 'dummy-user-1',
    allergies: ['Peanuts', 'Shellfish'],
    medications: ['Inhaler (Albuterol)'],
    medical_conditions: ['Asthma'],
    emergency_notes: 'Carries inhaler at all times. Contact coach immediately if breathing issues occur.',
    blood_type: 'O+',
    insurance_provider: 'Blue Cross Blue Shield',
    insurance_policy_number: 'BC123456789',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
};

export function useSettings() {
  const { user } = useAuth();
  const toast = useToast();
  
  const [settings, setSettings] = useState<UserSettingsComplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [user?.id]);

  const loadSettings = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // TODO: REMOVE DUMMY DATA - Replace with real Supabase query
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For now, return dummy data
      setSettings(DUMMY_SETTINGS);
      
      /* TODO: Replace with real Supabase calls when database is ready
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: privacyData, error: privacyError } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: emergencyData, error: emergencyError } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false });

      const { data: medicalData, error: medicalError } = await supabase
        .from('medical_information')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError || notificationsError || privacyError) {
        throw new Error('Failed to load settings');
      }

      setSettings({
        settings: settingsData,
        notifications: notificationsData,
        privacy: privacyData,
        emergencyContacts: emergencyData || [],
        medicalInfo: medicalData
      });
      */
      
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error loading settings',
        description: 'Could not load your settings. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateGeneralSettings = async (formData: SettingsFormData) => {
    if (!user?.id || !settings) return;

    setIsSaving(true);
    try {
      // TODO: REMOVE DUMMY DATA - Replace with real Supabase update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedSettings = {
        ...settings,
        settings: {
          ...settings.settings,
          ...formData,
          updated_at: new Date().toISOString(),
        }
      };
      
      setSettings(updatedSettings);
      
      /* TODO: Replace with real Supabase call when database is ready
      const { error } = await supabase
        .from('user_settings')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
      */

      toast({
        title: 'Settings updated',
        description: 'Your general settings have been saved.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error updating settings',
        description: 'Could not save your settings. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateNotificationSettings = async (formData: NotificationFormData) => {
    if (!user?.id || !settings) return;

    setIsSaving(true);
    try {
      // TODO: REMOVE DUMMY DATA - Replace with real Supabase update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedSettings = {
        ...settings,
        notifications: {
          ...settings.notifications,
          ...formData,
          updated_at: new Date().toISOString(),
        }
      };
      
      setSettings(updatedSettings);

      toast({
        title: 'Notification settings updated',
        description: 'Your notification preferences have been saved.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: 'Error updating notifications',
        description: 'Could not save your notification settings. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updatePrivacySettings = async (formData: PrivacyFormData) => {
    if (!user?.id || !settings) return;

    setIsSaving(true);
    try {
      // TODO: REMOVE DUMMY DATA - Replace with real Supabase update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedSettings = {
        ...settings,
        privacy: {
          ...settings.privacy,
          ...formData,
          updated_at: new Date().toISOString(),
        }
      };
      
      setSettings(updatedSettings);

      toast({
        title: 'Privacy settings updated',
        description: 'Your privacy preferences have been saved.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast({
        title: 'Error updating privacy',
        description: 'Could not save your privacy settings. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addEmergencyContact = async (contact: Omit<EmergencyContact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id || !settings) return;

    setIsSaving(true);
    try {
      // TODO: REMOVE DUMMY DATA - Replace with real Supabase insert
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newContact: EmergencyContact = {
        id: `dummy-emergency-${Date.now()}`,
        user_id: user.id,
        ...contact,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const updatedSettings = {
        ...settings,
        emergencyContacts: [...settings.emergencyContacts, newContact]
      };
      
      setSettings(updatedSettings);

      toast({
        title: 'Emergency contact added',
        description: 'New emergency contact has been saved.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      toast({
        title: 'Error adding contact',
        description: 'Could not add emergency contact. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateEmergencyContact = async (id: string, contact: Partial<EmergencyContact>) => {
    if (!user?.id || !settings) return;

    setIsSaving(true);
    try {
      // TODO: REMOVE DUMMY DATA - Replace with real Supabase update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedContacts = settings.emergencyContacts.map(c => 
        c.id === id ? { ...c, ...contact, updated_at: new Date().toISOString() } : c
      );
      
      const updatedSettings = {
        ...settings,
        emergencyContacts: updatedContacts
      };
      
      setSettings(updatedSettings);

      toast({
        title: 'Emergency contact updated',
        description: 'Emergency contact has been updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      toast({
        title: 'Error updating contact',
        description: 'Could not update emergency contact. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEmergencyContact = async (id: string) => {
    if (!user?.id || !settings) return;

    setIsSaving(true);
    try {
      // TODO: REMOVE DUMMY DATA - Replace with real Supabase delete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedContacts = settings.emergencyContacts.filter(c => c.id !== id);
      
      const updatedSettings = {
        ...settings,
        emergencyContacts: updatedContacts
      };
      
      setSettings(updatedSettings);

      toast({
        title: 'Emergency contact deleted',
        description: 'Emergency contact has been removed.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
      toast({
        title: 'Error deleting contact',
        description: 'Could not delete emergency contact. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    settings,
    isLoading,
    isSaving,
    loadSettings,
    updateGeneralSettings,
    updateNotificationSettings,
    updatePrivacySettings,
    addEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,
  };
} 