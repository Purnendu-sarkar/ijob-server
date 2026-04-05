export interface IAdminFilterRequest {
    searchTerm?: string;
    fullName?: string;
    email?: string;
    phone?: string;
}

export interface IAdminUser {
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

export interface IAdminResponse {
    id: string;
    userId: string;
    permissions: any | null;
    department: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: IAdminUser;
}