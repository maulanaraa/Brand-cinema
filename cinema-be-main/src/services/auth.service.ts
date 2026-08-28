import { userRepository } from '../repositories/user.repository';
import {
  hashPassword,
  comparePassword,
  signToken,
  createJwtPayload,
  generatePasswordResetToken,
  hashPasswordResetToken,
} from '../utils/auth.util';
import { verifyGoogleIdToken } from '../utils/google.util';
import { emailService } from './email.service';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES, PASSWORD_RESET_EXPIRE_MS } from '../constants';
import { IUser } from '../models/User';
import { UserRole } from '../types';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}

export interface GoogleAuthDto {
  idToken: string;
}

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  token: string;
}

export class AuthService {
  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await userRepository.existsByEmail(dto.email);
    if (existing) {
      throw new AppError('Unable to complete registration', HTTP_STATUS.BAD_REQUEST);
    }

    const hashedPassword = await hashPassword(dto.password);

    const user = await userRepository.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      role: UserRole.USER,
    });

    const token = this.generateToken(user);

    void emailService.sendWelcomeEmail({
      name: user.name,
      email: user.email,
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await userRepository.findByEmail(dto.email.toLowerCase(), true);

    if (!user) {
      throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!user.password) {
      throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
    }

    const isMatch = await comparePassword(dto.password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await userRepository.findByEmail(dto.email.toLowerCase());

    if (user) {
      const resetToken = generatePasswordResetToken();
      const hashedToken = hashPasswordResetToken(resetToken);
      const expires = new Date(Date.now() + PASSWORD_RESET_EXPIRE_MS);

      await userRepository.update(user._id.toString(), {
        passwordResetToken: hashedToken,
        passwordResetExpires: expires,
      });

      void emailService.sendPasswordResetEmail({
        name: user.name,
        email: user.email,
        resetToken,
      });
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const hashedToken = hashPasswordResetToken(dto.token);
    const user = await userRepository.findByPasswordResetToken(hashedToken);

    if (!user) {
      throw new AppError('Invalid or expired reset token', HTTP_STATUS.BAD_REQUEST);
    }

    const hashedPassword = await hashPassword(dto.password);

    await userRepository.update(user._id.toString(), {
      password: hashedPassword,
      $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
      $inc: { tokenVersion: 1 },
    });
  }

  async googleAuth(dto: GoogleAuthDto): Promise<AuthResult> {
    const googleUser = await verifyGoogleIdToken(dto.idToken);

    if (!googleUser.emailVerified) {
      throw new AppError('Google email is not verified', HTTP_STATUS.BAD_REQUEST);
    }

    let user = await userRepository.findByGoogleId(googleUser.googleId);

    if (!user) {
      const existingByEmail = await userRepository.findByEmail(googleUser.email);

      if (existingByEmail) {
        user = await userRepository.update(existingByEmail._id.toString(), {
          googleId: googleUser.googleId,
        });

        if (!user) {
          throw new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
        }
      } else {
        user = await userRepository.create({
          name: googleUser.name,
          email: googleUser.email,
          googleId: googleUser.googleId,
          role: UserRole.USER,
        });

        void emailService.sendWelcomeEmail({
          name: user.name,
          email: user.email,
        });
      }
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async getMe(userId: string): Promise<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: Date;
  }> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  private generateToken(user: IUser): string {
    return signToken(createJwtPayload(user));
  }
}

export const authService = new AuthService();
