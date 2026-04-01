import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import ApiError from "../../errors/ApiError";
import { prisma } from "../../../lib/prisma";
import { UserStatus } from "../../../../prisma/generated/prisma/enums";

const loginUser = async (payload: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      fullName: true,
      needPasswordChange: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found or account not active.");
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid password.");
  }

  const accessToken = jwtHelpers.generateToken(
    { userId: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as Secret,
    "15m" // short lived
  );

  const refreshToken = jwtHelpers.generateToken(
    { userId: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as Secret, // same secret for simplicity (or use different)
    "30d"
  );

  // Optional: store refresh token in DB for revocation (future improvement)

  return {
    accessToken,
    refreshToken,
    user,
  };
};

export const AuthServices = {
  loginUser,
};