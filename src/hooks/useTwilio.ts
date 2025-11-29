// import { getServerEndpoint, getAuthHeaders, getSupabaseClient } from '../utils/supabase/client';

// export function useTwilio() {
//   const supabase = getSupabaseClient();

//   const makeCall = async (phoneNumber: string, medicationName: string, reminderId: string) => {
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
      
//       if (!session?.access_token) {
//         throw new Error('Not authenticated');
//       }

//       const response = await fetch(getServerEndpoint('/make-call'), {
//         method: 'POST',
//         headers: getAuthHeaders(session.access_token),
//         body: JSON.stringify({ phoneNumber, medicationName, reminderId })
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to make call');
//       }

//       const data = await response.json();
//       return { success: true, callSid: data.callSid };
//     } catch (err: any) {
//       console.error('Make call error:', err);
//       return { success: false, error: err.message };
//     }
//   };

//   const getReminderStatus = async (reminderId: string) => {
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
      
//       if (!session?.access_token) {
//         throw new Error('Not authenticated');
//       }

//       const response = await fetch(getServerEndpoint(`/twilio/reminder-status/${reminderId}`), {
//         headers: getAuthHeaders(session.access_token)
//       });

//       if (!response.ok) {
//         throw new Error('Failed to get reminder status');
//       }

//       const data = await response.json();
//       return { success: true, status: data.status };
//     } catch (err: any) {
//       console.error('Get reminder status error:', err);
//       return { success: false, error: err.message };
//     }
//   };

//   return {
//     makeCall,
//     getReminderStatus
//   };
// }

import { getServerEndpoint, getAuthHeaders, getSupabaseClient } from '../utils/supabase/client';

export function useTwilio() {
  const supabase = getSupabaseClient();

  const makeCall = async (phoneNumber: string, medicationName: string, reminderId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await fetch(
        // UPDATED ENDPOINT
        "https://zdjzdwujvvrabbzazkbc.supabase.co/functions/v1/make-call",
        {
          method: 'POST',
          headers: getAuthHeaders(session.access_token),
          body: JSON.stringify({ phoneNumber, medicationName, reminderId })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to make call');
      }

      const data = await response.json();
      return { success: true, callSid: data.callSid };
    } catch (err: any) {
      console.error('Make call error:', err);
      return { success: false, error: err.message };
    }
  };

  const getReminderStatus = async (reminderId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await fetch(
        // UPDATED ENDPOINT WITH QUERY STRING
        `https://zdjzdwujvvrabbzazkbc.supabase.co/functions/v1/reminder-status?reminderId=${reminderId}`,
        {
          headers: getAuthHeaders(session.access_token)
        }
      );

      if (!response.ok) throw new Error('Failed to get reminder status');

      const data = await response.json();
      return { success: true, status: data.status };
    } catch (err: any) {
      console.error('Get reminder status error:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    makeCall,
    getReminderStatus
  };
}
