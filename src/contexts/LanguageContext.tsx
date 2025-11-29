import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'hi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  hi: {
    // App name
    appName: 'आरोग्य सेतु',
    tagline: 'आपकी दवाई का साथी',
    
    // Home/Onboarding
    welcome: 'स्वागत है',
    getStarted: 'शुरू करें',
    login: 'लॉगिन करें',
    signup: 'साइन अप करें',
    alreadyHaveAccount: 'पहले से खाता है?',
    dontHaveAccount: 'खाता नहीं है?',
    
    // Features
    timelyReminders: 'समय पर रिमाइंडर',
    easyToUse: 'आसान उपयोग',
    secureData: 'सुरक्षित डेटा',
    voiceSupport: 'आवाज़ समर्थन',
    
    // User roles
    whoAreYou: 'आप कौन हैं?',
    patient: 'मरीज़',
    patientDesc: 'मुझे दवाई लेनी है',
    caregiver: 'देखभालकर्ता',
    caregiverDesc: 'मैं किसी की देखभाल करता हूं',
    provider: 'डॉक्टर / नर्स',
    providerDesc: 'मैं स्वास्थ्य सेवा देता हूं',
    
    // Form fields
    name: 'आपका नाम',
    phone: 'मोबाइल नंबर',
    email: 'ईमेल',
    password: 'पासवर्ड',
    emergencyContact: 'आपातकालीन संपर्क',
    next: 'आगे बढ़ें',
    
    // Dashboard
    dashboard: 'डैशबोर्ड',
    myMedications: 'मेरी दवाइयां',
    upcomingReminders: 'आने वाली दवाइयां',
    taken: 'ली गई',
    upcoming: 'बाकी हैं',
    missed: 'छूटी हुई',
    addMedication: 'नई दवाई',
    settings: 'सेटिंग्स',
    
    // Prescription
    uploadPrescription: 'प्रिस्क्रिप्शन जोड़ें',
    takePhoto: 'कैमरा से फोटो लें',
    chooseFromGallery: 'गैलरी से चुनें',
    processing: 'प्रोसेस हो रहा है...',
    confirm: 'सब सही है, सहेजें',
    
    // Time
    morning: 'सुबह',
    afternoon: 'दोपहर',
    evening: 'शाम',
    night: 'रात',
    
    // Common
    back: 'वापस',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    loading: 'लोड हो रहा है...',
    
    // Notifications
    medicationTime: 'दवाई का समय',
    takeNow: 'अभी लें',
    snooze: 'स्नूज़',
    
    // Language
    language: 'भाषा',
    hindi: 'हिंदी',
    english: 'अंग्रेज़ी',
  },
  en: {
    // App name
    appName: 'Aarogya Setu',
    tagline: 'Your Medication Companion',
    
    // Home/Onboarding
    welcome: 'Welcome',
    getStarted: 'Get Started',
    login: 'Login',
    signup: 'Sign Up',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    
    // Features
    timelyReminders: 'Timely Reminders',
    easyToUse: 'Easy to Use',
    secureData: 'Secure Data',
    voiceSupport: 'Voice Support',
    
    // User roles
    whoAreYou: 'Who are you?',
    patient: 'Patient',
    patientDesc: 'I need to take medication',
    caregiver: 'Caregiver',
    caregiverDesc: 'I take care of someone',
    provider: 'Doctor / Nurse',
    providerDesc: 'I provide healthcare',
    
    // Form fields
    name: 'Your Name',
    phone: 'Mobile Number',
    email: 'Email',
    password: 'Password',
    emergencyContact: 'Emergency Contact',
    next: 'Next',
    
    // Dashboard
    dashboard: 'Dashboard',
    myMedications: 'My Medications',
    upcomingReminders: 'Upcoming Medications',
    taken: 'Taken',
    upcoming: 'Upcoming',
    missed: 'Missed',
    addMedication: 'Add Medication',
    settings: 'Settings',
    
    // Prescription
    uploadPrescription: 'Upload Prescription',
    takePhoto: 'Take Photo',
    chooseFromGallery: 'Choose from Gallery',
    processing: 'Processing...',
    confirm: 'Confirm & Save',
    
    // Time
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    night: 'Night',
    
    // Common
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    
    // Notifications
    medicationTime: 'Medication Time',
    takeNow: 'Take Now',
    snooze: 'Snooze',
    
    // Language
    language: 'Language',
    hindi: 'Hindi',
    english: 'English',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('hi');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['hi']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
