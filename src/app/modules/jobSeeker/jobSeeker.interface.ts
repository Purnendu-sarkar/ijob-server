export interface IJobSeekerFilterRequest {
  searchTerm?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  experienceYears?: number;
  isProfileVerified?: string;
}

export interface IJobSeekerUser {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  profilePhotoUrl: string | null;
  role: string;
  status: string;
  needPasswordChange: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobSeekerProfileResponse {
  id: string;
  userId: string;
  fullName: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  currentLocationId: string | null;
  expectedSalaryMin: number | null;
  expectedSalaryMax: number | null;
  experienceYears: number | null;
  about: string | null;
  preferredJobTypes: string[];
  preferredLocations: string[];
  profileCompletion: number | null;
  isProfileVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: IJobSeekerUser;
}