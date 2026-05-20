export interface EnquiryFormData {
  title?: string;
  fullName: string;
  companyName?: string;
  jobTitle?: string;
  email: string;
  mobile: string;
  officeNumber?: string;
  department?: string;
  interests: string[];
  visitingCard?: File | null;
  voiceNote?: File | null;
  venueId?: string;
  remarks?: string;
}

export interface EnquiryPayload {
  title: string;
  fullName: string;
  companyName: string;
  jobTitle: string;
  email: string;
  mobile: string;
  officeNumber: string;
  department: string;
  interests: string[];
  visitingCardUrl: string;
  voiceNoteUrl?: string;
  venueId?: string;
  remarks: string;
  createdAt: string;
}
