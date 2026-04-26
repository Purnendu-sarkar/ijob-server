export interface IEmployerFilterRequest {
  searchTerm?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  designation?: string;
  companyVerificationStatus?: string;
}

export interface IEmployerUser {
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

export interface IEmployerCompany {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  address: string | null;
  verificationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployerResponse {
  id: string;
  userId: string;
  designation: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: IEmployerUser;
  company: IEmployerCompany;
}

