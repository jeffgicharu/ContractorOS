import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  loginSchema,
  inviteAcceptSchema,
  type LoginInput,
  type InviteAcceptInput,
} from '@contractor-os/shared';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth.guard';
import { CurrentUser, type JwtPayload } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body);

    this.setRefreshCookie(res, result.refreshToken);

    return {
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie(REFRESH_COOKIE_NAME);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const result = await this.authService.refresh(refreshToken);

    this.setRefreshCookie(res, result.refreshToken);

    return {
      data: {
        accessToken: result.accessToken,
      },
    };
  }

  @Post('invite/accept')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(inviteAcceptSchema))
  async acceptInvite(
    @Body() body: InviteAcceptInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.acceptInvite(body);

    this.setRefreshCookie(res, result.refreshToken);

    return {
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: JwtPayload) {
    const profile = await this.authService.getMe(user.sub);

    return { data: profile };
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_COOKIE_MAX_AGE,
      path: '/',
    });
  }
}
