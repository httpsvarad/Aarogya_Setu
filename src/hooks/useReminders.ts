// import { useState, useEffect } from 'react';
// import { getSupabaseClient } from '../utils/supabase/client';
// import { useAuth } from './useAuth';

// export interface Reminder {
//   id: string;
//   user_id: string;
//   medication_id: string;
//   medication_name: string;
//   scheduled_time: string; // HH:MM format
//   days_of_week: number[]; // 0-6 (Sunday-Saturday)
//   enabled: boolean;
//   call_enabled: boolean;
//   sms_enabled: boolean;
//   push_enabled: boolean;
//   tone: 'gentle' | 'standard' | 'urgent';
//   created_at: string;
//   updated_at: string;
// }

// export interface DoseHistory {
//   id: string;
//   user_id: string;
//   medication_id: string;
//   reminder_id: string;
//   scheduled_time: string;
//   taken_at: string | null;
//   status: 'taken' | 'missed' | 'snoozed' | 'pending';
//   verification_method: 'camera' | 'manual' | 'call' | 'sms' | null;
//   notes: string | null;
//   created_at: string;
// }

// export interface CallLog {
//   id: string;
//   user_id: string;
//   reminder_id: string;
//   medication_name: string;
//   call_time: string;
//   call_duration: number;
//   status: 'completed' | 'no_answer' | 'busy' | 'failed';
//   dtmf_response: string | null;
//   created_at: string;
// }

// export function useReminders() {
//   const [reminders, setReminders] = useState<Reminder[]>([]);
//   const [doseHistory, setDoseHistory] = useState<DoseHistory[]>([]);
//   const [callLogs, setCallLogs] = useState<CallLog[]>([]);
//   const [loading, setLoading] = useState(true);
//   const supabase = getSupabaseClient();
//   const { user } = useAuth();

//   useEffect(() => {
//     if (user) {
//       loadReminders();
//       loadDoseHistory();
//       loadCallLogs();
//     }
//   }, [user]);

//   const loadReminders = async () => {
//     try {
//       console.log('[useReminders] Loading reminders from Supabase...');
      
//       if (!user) {
//         console.warn('[useReminders] No user, skipping load');
//         setReminders([]);
//         return;
//       }

//       const { data, error } = await supabase
//         .from('reminders')
//         .select(`
//           *,
//           medications:medication_id (
//             id,
//             name,
//             strength
//           )
//         `)
//         .eq('user_id', user.id)
//         .order('scheduled_time', { ascending: true });

//       if (error) {
//         console.error('[useReminders] Error loading reminders:', error);
//         throw error;
//       }

//       console.log('[useReminders] Loaded reminders:', data?.length || 0);

//       // Map the data and include medication name
//       const mappedReminders = (data || []).map((reminder: any) => ({
//         id: reminder.id,
//         user_id: reminder.user_id,
//         medication_id: reminder.medication_id,
//         medication_name: reminder.medications?.name || 'Unknown Medication',
//         scheduled_time: reminder.scheduled_time,
//         days_of_week: reminder.days_of_week || [],
//         enabled: reminder.enabled,
//         call_enabled: reminder.call_enabled,
//         sms_enabled: reminder.sms_enabled,
//         push_enabled: reminder.push_enabled,
//         tone: reminder.tone || 'gentle',
//         created_at: reminder.created_at,
//         updated_at: reminder.updated_at
//       }));

//       setReminders(mappedReminders);
//     } catch (error) {
//       console.error('[useReminders] Failed to load reminders:', error);
//       setReminders([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadDoseHistory = async () => {
//     try {
//       if (!user) return;

//       const { data, error } = await supabase
//         .from('dose_history')
//         .select('*')
//         .eq('user_id', user.id)
//         .order('scheduled_time', { ascending: false })
//         .limit(50);

//       if (error) throw error;

//       setDoseHistory(data || []);
//     } catch (error) {
//       console.error('[useReminders] Failed to load dose history:', error);
//       setDoseHistory([]);
//     }
//   };

//   const loadCallLogs = async () => {
//     try {
//       if (!user) return;

//       const { data, error } = await supabase
//         .from('call_logs')
//         .select(`
//           *,
//           medications:medication_id (
//             name
//           )
//         `)
//         .eq('user_id', user.id)
//         .order('call_time', { ascending: false })
//         .limit(50);

//       if (error) throw error;

//       const mappedLogs = (data || []).map((log: any) => ({
//         id: log.id,
//         user_id: log.user_id,
//         reminder_id: log.reminder_id,
//         medication_name: log.medications?.name || 'Unknown',
//         call_time: log.call_time,
//         call_duration: log.call_duration || 0,
//         status: log.status,
//         dtmf_response: log.dtmf_response,
//         created_at: log.created_at
//       }));

//       setCallLogs(mappedLogs);
//     } catch (error) {
//       console.error('[useReminders] Failed to load call logs:', error);
//       setCallLogs([]);
//     }
//   };

//   const createReminder = async (reminder: Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
//     if (!user) return { success: false, error: 'Not authenticated' };

//     try {
//       const { data, error } = await supabase
//         .from('reminders')
//         .insert([{
//           ...reminder,
//           user_id: user.id
//         }])
//         .select()
//         .single();

//       if (error) throw error;

//       setReminders([...reminders, data]);
//       return { success: true, data };
//     } catch (error: any) {
//       console.error('Error creating reminder:', error);
//       return { success: false, error: error.message };
//     }
//   };

//   const updateReminder = async (id: string, updates: Partial<Reminder>) => {
//     if (!user) return { success: false, error: 'Not authenticated' };

//     try {
//       const { data, error } = await supabase
//         .from('reminders')
//         .update({
//           ...updates,
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', id)
//         .eq('user_id', user.id)
//         .select()
//         .single();

//       if (error) throw error;

//       setReminders(reminders.map(r => r.id === id ? data : r));
//       return { success: true, data };
//     } catch (error: any) {
//       console.error('Error updating reminder:', error);
//       return { success: false, error: error.message };
//     }
//   };

//   const deleteReminder = async (id: string) => {
//     if (!user) return { success: false, error: 'Not authenticated' };

//     try {
//       const { error } = await supabase
//         .from('reminders')
//         .delete()
//         .eq('id', id)
//         .eq('user_id', user.id);

//       if (error) throw error;

//       setReminders(reminders.filter(r => r.id !== id));
//       return { success: true };
//     } catch (error: any) {
//       console.error('Error deleting reminder:', error);
//       return { success: false, error: error.message };
//     }
//   };

//   const toggleReminder = async (id: string, enabled: boolean) => {
//     return updateReminder(id, { enabled });
//   };

//   const recordDose = async (dose: Omit<DoseHistory, 'id' | 'user_id' | 'created_at'>) => {
//     if (!user) return { success: false, error: 'Not authenticated' };

//     try {
//       const { data, error } = await supabase
//         .from('dose_history')
//         .insert([{
//           ...dose,
//           user_id: user.id
//         }])
//         .select()
//         .single();

//       if (error) throw error;

//       setDoseHistory([data, ...doseHistory]);
//       return { success: true, data };
//     } catch (error: any) {
//       console.error('Error recording dose:', error);
//       return { success: false, error: error.message };
//     }
//   };

//   const getTodayStats = () => {
//     const today = new Date().toISOString().split('T')[0];
//     const todayDoses = doseHistory.filter(d => d.scheduled_time.startsWith(today));

//     return {
//       taken: todayDoses.filter(d => d.status === 'taken').length,
//       missed: todayDoses.filter(d => d.status === 'missed').length,
//       pending: todayDoses.filter(d => d.status === 'pending').length,
//       total: todayDoses.length
//     };
//   };

//   const getUpcomingReminders = () => {
//     const now = new Date();
//     const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
//     const currentDay = now.getDay();

//     return reminders.filter(r => 
//       r.enabled && 
//       r.days_of_week.includes(currentDay) &&
//       r.scheduled_time > currentTime
//     );
//   };

//   return {
//     reminders,
//     doseHistory,
//     callLogs,
//     loading,
//     createReminder,
//     updateReminder,
//     deleteReminder,
//     toggleReminder,
//     recordDose,
//     getTodayStats,
//     getUpcomingReminders,
//     refreshReminders: loadReminders,
//     refreshDoseHistory: loadDoseHistory,
//     refreshCallLogs: loadCallLogs
//   };
// }

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';
import { useAuth } from './useAuth';

export interface Reminder {
  id: string;
  user_id: string;
  medication_id: string;
  medication_name: string;
  scheduled_time: string; // HH:MM format
  days_of_week: number[]; // 0-6 (Sunday-Saturday)
  enabled: boolean;
  call_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  tone: 'gentle' | 'standard' | 'urgent';
  created_at: string;
  updated_at: string;
}

export interface DoseHistory {
  id: string;
  user_id: string;
  medication_id: string;
  reminder_id: string;
  scheduled_time: string;
  taken_at: string | null;
  status: 'taken' | 'missed' | 'snoozed' | 'pending';
  verification_method: 'camera' | 'manual' | 'call' | 'sms' | null;
  notes: string | null;
  created_at: string;
}

export interface CallLog {
  id: string;
  user_id: string;
  reminder_id: string;
  medication_name: string;
  call_time: string;
  call_duration: number;
  status: 'completed' | 'no_answer' | 'busy' | 'failed';
  dtmf_response: string | null;
  created_at: string;
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [doseHistory, setDoseHistory] = useState<DoseHistory[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadReminders();
      loadDoseHistory();
      loadCallLogs();
    }
  }, [user]);

  const loadReminders = async () => {
    try {
      console.log('[useReminders] Loading reminders from Supabase...');
      
      if (!user) {
        console.warn('[useReminders] No user, skipping load');
        setReminders([]);
        return;
      }

      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          medications:medication_id (
            id,
            name,
            strength
          )
        `)
        .eq('user_id', user.id)
        .order('scheduled_time', { ascending: true });

      if (error) {
        console.error('[useReminders] Error loading reminders:', error);
        throw error;
      }

      console.log('[useReminders] Loaded reminders:', data?.length || 0);

      // Map the data and include medication name
      const mappedReminders = (data || []).map((reminder: any) => ({
        id: reminder.id,
        user_id: reminder.user_id,
        medication_id: reminder.medication_id,
        medication_name: reminder.medications?.name || 'Unknown Medication',
        scheduled_time: reminder.scheduled_time,
        days_of_week: reminder.days_of_week || [],
        enabled: reminder.enabled,
        call_enabled: reminder.call_enabled,
        sms_enabled: reminder.sms_enabled,
        push_enabled: reminder.push_enabled,
        tone: reminder.tone || 'gentle',
        created_at: reminder.created_at,
        updated_at: reminder.updated_at
      }));

      setReminders(mappedReminders);
    } catch (error) {
      console.error('[useReminders] Failed to load reminders:', error);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDoseHistory = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('dose_history')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_time', { ascending: false })
        .limit(50);

      if (error) throw error;

      setDoseHistory(data || []);
    } catch (error) {
      console.error('[useReminders] Failed to load dose history:', error);
      setDoseHistory([]);
    }
  };

  const loadCallLogs = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('call_logs')
        .select(`
          *,
          medications:medication_id (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('call_time', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mappedLogs = (data || []).map((log: any) => ({
        id: log.id,
        user_id: log.user_id,
        reminder_id: log.reminder_id,
        medication_name: log.medications?.name || 'Unknown',
        call_time: log.call_time,
        call_duration: log.call_duration || 0,
        status: log.status,
        dtmf_response: log.dtmf_response,
        created_at: log.created_at
      }));

      setCallLogs(mappedLogs);
    } catch (error) {
      console.error('[useReminders] Failed to load call logs:', error);
      setCallLogs([]);
    }
  };

  const createReminder = async (reminder: Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert([{
          ...reminder,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setReminders([...reminders, data]);
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating reminder:', error);
      return { success: false, error: error.message };
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('reminders')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setReminders(reminders.map(r => r.id === id ? data : r));
      return { success: true, data };
    } catch (error: any) {
      console.error('Error updating reminder:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteReminder = async (id: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setReminders(reminders.filter(r => r.id !== id));
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting reminder:', error);
      return { success: false, error: error.message };
    }
  };

  const toggleReminder = async (id: string, enabled: boolean) => {
    return updateReminder(id, { enabled });
  };

  const recordDose = async (dose: Omit<DoseHistory, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('dose_history')
        .insert([{
          ...dose,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setDoseHistory([data, ...doseHistory]);
      return { success: true, data };
    } catch (error: any) {
      console.error('Error recording dose:', error);
      return { success: false, error: error.message };
    }
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayDoses = doseHistory.filter(d => d.scheduled_time.startsWith(today));

    return {
      taken: todayDoses.filter(d => d.status === 'taken').length,
      missed: todayDoses.filter(d => d.status === 'missed').length,
      pending: todayDoses.filter(d => d.status === 'pending').length,
      total: todayDoses.length
    };
  };

  const getUpcomingReminders = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay();

    return reminders.filter(r => 
      r.enabled && 
      r.days_of_week.includes(currentDay) &&
      r.scheduled_time > currentTime
    );
  };

  return {
    reminders,
    doseHistory,
    callLogs,
    loading,
    createReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    recordDose,
    getTodayStats,
    getUpcomingReminders,
    refreshReminders: loadReminders,
    refreshDoseHistory: loadDoseHistory,
    refreshCallLogs: loadCallLogs
  };
}