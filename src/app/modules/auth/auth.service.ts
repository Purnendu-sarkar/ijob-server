import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import ApiError from "../../errors/ApiError";
import { prisma } from "../../../lib/prisma";
import { UserRole, UserStatus } from "../../../../prisma/generated/prisma/enums";

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

const refreshToken = async (oldRefreshToken: string) => {
  let decoded;
  try {
    decoded = jwtHelpers.verifyToken(oldRefreshToken, config.jwt.jwt_secret as Secret);
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId, status: UserStatus.ACTIVE },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const newAccessToken = jwtHelpers.generateToken(
    { userId: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as Secret,
    "15m"
  );

  const newRefreshToken = jwtHelpers.generateToken(
    { userId: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as Secret,
    "30d"
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const changePassword = async (
  user: { userId: string; email: string; role: UserRole },
  payload: { oldPassword: string; newPassword: string }
) => {
  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.userId },
  });

  const isOldPasswordCorrect = await bcrypt.compare(payload.oldPassword, dbUser.passwordHash);
  if (!isOldPasswordCorrect) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid old password.");
  }

  const hashed = await bcrypt.hash(payload.newPassword, config.salt_rounds);

  await prisma.user.update({
    where: { id: user.userId },
    data: {
      passwordHash: hashed,
      needPasswordChange: false,
    },
  });

  return { message: "Password changed successfully." };
};


export const AuthServices = {
  loginUser,
  refreshToken,
  changePassword,
};