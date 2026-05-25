export interface EnquiryFormData {
  title?: string;
  fullName: string;
  companyName?: string;
  jobTitle?: string;
  email: string;
  mobile: string;
  alternateMobile?: string;
  officeNumber?: string;
  department?: string;
  interests: string[];
  visitingCard?: File | null;
  visitingCard2?: File | null;
  voiceNote?: File | null;
  voiceNote2?: File | null;
  venueId?: string;
  remarks?: string;
  referredBy?: string;
}

export interface EnquiryPayload {
  title: string;
  fullName: string;
  companyName: string;
  jobTitle: string;
  email: string;
  mobile: string;
  alternateMobile?: string;
  officeNumber: string;
  department: string;
  interests: string[];
  visitingCardUrl: string;
  visitingCardUrl2?: string;
  voiceNoteUrl?: string;
  voiceNoteUrl2?: string;
  venueId?: string;
  remarks: string;
  referred_by?: string;
  createdAt: string;
}