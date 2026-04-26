import slugify from "slugify";
import { prisma } from "../../../lib/prisma";
import { IPaginationOptions } from "../../interfaces/pagination";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { IEmployerFilterRequest } from "./employer.interface";
import {
  Prisma,
  UserStatus,
  VerificationStatus,
} from "../../../prisma/generated/client/client";

const employerSelect = {
  id: true,
  userId: true,
  designation: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      fullName: true,
      profilePhotoUrl: true,
      role: true,
      status: true,
      needPasswordChange: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  company: {
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      website: true,
      logoUrl: true,
      address: true,
      verificationStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  },
};

const getAllFromDB = async (
  params: IEmployerFilterRequest,
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.EmployerProfileWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { user: { fullName: { contains: searchTerm, mode: "insensitive" } } },
        { user: { email: { contains: searchTerm, mode: "insensitive" } } },
        { user: { phone: { contains: searchTerm, mode: "insensitive" } } },
        { company: { name: { contains: searchTerm, mode: "insensitive" } } },
        { designation: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (filterData.fullName) {
    andConditions.push({
      user: { fullName: { contains: filterData.fullName, mode: "insensitive" } },
    });
  }

  if (filterData.email) {
    andConditions.push({
      user: { email: { contains: filterData.email, mode: "insensitive" } },
    });
  }

  if (filterData.phone) {
    andConditions.push({
      user: { phone: { contains: filterData.phone, mode: "insensitive" } },
    });
  }

  if (filterData.companyName) {
    andConditions.push({
      company: { name: { contains: filterData.companyName, mode: "insensitive" } },
    });
  }

  if (filterData.designation) {
    andConditions.push({
      designation: { contains: filterData.designation, mode: "insensitive" },
    });
  }

  if (
    filterData.companyVerificationStatus === "PENDING" ||
    filterData.companyVerificationStatus === "VERIFIED" ||
    filterData.companyVerificationStatus === "REJECTED"
  ) {
    andConditions.push({
      company: {
        verificationStatus: filterData.companyVerificationStatus as VerificationStatus,
      },
    });
  }

  andConditions.push({
    user: { status: { not: UserStatus.DELETED } },
  });

  const whereConditions: Prisma.EmployerProfileWhereInput = { AND: andConditions };

  let orderBy: Prisma.EmployerProfileOrderByWithRelationInput = {
    createdAt: "desc",
  };

  if (options.sortBy && options.sortOrder) {
    if (options.sortBy === "name") {
      orderBy = { user: { fullName: options.sortOrder as Prisma.SortOrder } };
    } else if (options.sortBy === "email") {
      orderBy = { user: { email: options.sortOrder as Prisma.SortOrder } };
    } else if (options.sortBy === "phone") {
      orderBy = { user: { phone: options.sortOrder as Prisma.SortOrder } };
    } else if (options.sortBy === "companyName") {
      orderBy = { company: { name: options.sortOrder as Prisma.SortOrder } };
    } else if (options.sortBy === "companyVerificationStatus") {
      orderBy = {
        company: { verificationStatus: options.sortOrder as Prisma.SortOrder },
      };
    } else {
      orderBy = { [options.sortBy]: options.sortOrder as Prisma.SortOrder };
    }
  }

  const result = await prisma.employerProfile.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy,
    select: employerSelect,
  });

  const total = await prisma.employerProfile.count({ where: whereConditions });

  return {
    meta: { page, limit, total },
    data: result,
  };
};

const getByIdFromDB = async (id: string) => {
  const result = await prisma.employerProfile.findFirst({
    where: {
      id,
      user: { status: { not: UserStatus.DELETED } },
    },
    select: employerSelect,
  });

  if (!result) {
    throw new Error("Employer not found or deleted");
  }

  return result;
};

const updateIntoDB = async (id: string, payload: any) => {
  const existingEmployer = await prisma.employerProfile.findFirstOrThrow({
    where: { id, user: { status: { not: UserStatus.DELETED } } },
    select: {
      userId: true,
      companyId: true,
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return prisma.$transaction(async (tx) => {
    const updateData: Prisma.EmployerProfileUpdateInput = {};
    const companyData: Prisma.CompanyUpdateInput = {};

    if (typeof payload.name === "string" && payload.name.trim()) {
      updateData.user = {
        update: { fullName: payload.name.trim() },
      };
    }

    if (typeof payload.phone === "string" && payload.phone.trim()) {
      updateData.user = {
        update: {
          ...(typeof payload.name === "string" && payload.name.trim()
            ? { fullName: payload.name.trim() }
            : {}),
          phone: payload.phone.trim(),
        },
      };
    }

    if (typeof payload.designation === "string") {
      updateData.designation = payload.designation.trim() || null;
    }

    if (typeof payload.companyName === "string" && payload.companyName.trim()) {
      const nextCompanyName = payload.companyName.trim();

      if (nextCompanyName !== existingEmployer.company.name) {
        const duplicate = await tx.company.findFirst({
          where: {
            name: { equals: nextCompanyName, mode: "insensitive" },
            id: { not: existingEmployer.companyId },
          },
        });

        if (duplicate) {
          throw new Error(`A company named "${nextCompanyName}" already exists.`);
        }

        companyData.name = nextCompanyName;
        companyData.slug = slugify(nextCompanyName, {
          lower: true,
          strict: true,
          trim: true,
        });
      }
    }

    if (typeof payload.companyDescription === "string") {
      companyData.description = payload.companyDescription.trim() || null;
    }

    if (typeof payload.companyWebsite === "string") {
      companyData.website = payload.companyWebsite.trim() || null;
    }

    if (typeof payload.companyAddress === "string") {
      companyData.address = payload.companyAddress.trim() || null;
    }

    if (
      payload.companyVerificationStatus === "PENDING" ||
      payload.companyVerificationStatus === "VERIFIED" ||
      payload.companyVerificationStatus === "REJECTED"
    ) {
      companyData.verificationStatus = payload.companyVerificationStatus as VerificationStatus;
    }

    if (Object.keys(companyData).length > 0) {
      await tx.company.update({
        where: { id: existingEmployer.companyId },
        data: companyData,
      });
    }

    return tx.employerProfile.update({
      where: { id },
      data: updateData,
      select: employerSelect,
    });
  });
};

const softDeleteFromDB = async (id: string) => {
  const employer = await prisma.employerProfile.findFirstOrThrow({
    where: { id, user: { status: { not: UserStatus.DELETED } } },
    select: {
      userId: true,
    },
  });

  await prisma.user.update({
    where: { id: employer.userId },
    data: { status: UserStatus.DELETED },
  });

  return { message: "Employer soft deleted successfully", id };
};

const hardDeleteFromDB = async (id: string) => {
  const employer = await prisma.employerProfile.findUniqueOrThrow({
    where: { id },
    select: {
      userId: true,
      companyId: true,
    },
  });

  return prisma.$transaction(async (tx) => {
    const remainingEmployers = await tx.employerProfile.count({
      where: {
        companyId: employer.companyId,
        id: { not: id },
      },
    });

    await tx.employerProfile.delete({ where: { id } });
    await tx.user.delete({ where: { id: employer.userId } });

    if (remainingEmployers === 0) {
      await tx.company.delete({ where: { id: employer.companyId } });
    }

    return { message: "Employer permanently deleted", id };
  });
};

export const EmployerService = {
  getAllFromDB,
  getByIdFromDB,
  updateIntoDB,
  softDeleteFromDB,
  hardDeleteFromDB,
};

