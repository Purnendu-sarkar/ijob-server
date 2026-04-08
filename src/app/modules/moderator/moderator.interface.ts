export interface IModeratorFilterRequest {
    searchTerm?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    assignedRegions?: string | string[];
}

export interface IModeratorUser {
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

export interface IModeratorResponse {
    id: string;
    userId: string;
    bio: string | null;
    assignedRegions: string[];
    createdAt: Date;
    updatedAt: Date;
    user: IModeratorUser;
}