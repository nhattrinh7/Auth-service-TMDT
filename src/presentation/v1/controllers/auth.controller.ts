import { Controller, Post, Body, HttpCode, HttpStatus, Headers } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { RegisterCommand } from '~/application/commands/register/register.command'
import { LoginCommand } from '~/application/commands/login/login.command'
import { GoogleLoginCommand } from '~/application/commands/google-login/google-login.command'
import { VerifyEmailCommand } from '~/application/commands/verify-email/verify-email.command'
import { RefreshTokenCommand } from '~/application/commands/refresh-token/refresh-token.command'
import { VerifyRequestCommand } from '~/application/commands/verify-request/verify-request.command'
import { LogoutCommand } from '~/application/commands/logout/logout.command'
import { ForgotPasswordCommand } from '~/application/commands/forgot-password/forgot-password.command'
import { ResetPasswordCommand } from '~/application/commands/reset-password/reset-password.command'
import {
  RegisterBodyDto,
  RegisterResponseDto,
  LoginBodyDto,
  LoginResponseDto,
  GoogleLoginBodyDto,
  VerifyEmailBodyDto,
  RefreshTokenBodyDto,
  VerifyRequestResponseDto,
  ForgotPasswordBodyDto,
  ResetPasswordBodyDto,
} from '~/presentation/dtos/user.dto'

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterBodyDto): Promise<any> {
    const { email, password, fullName, phoneNumber, dob, gender } = body

    const result = await this.commandBus.execute<RegisterCommand, RegisterResponseDto>(
      new RegisterCommand(email, password, fullName, phoneNumber, dob, gender),
    )
    return { message: 'Register succesfully!', data: result }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginBodyDto, @Headers('user-agent') userAgent: string): Promise<any> {
    const { email, password } = body

    const result = await this.commandBus.execute<LoginCommand, LoginResponseDto>(
      new LoginCommand(email, password, userAgent),
    )
    return { message: 'Login succesfully!', data: result }
  }

  @Post('google-login')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body() body: GoogleLoginBodyDto, @Headers('user-agent') userAgent: string): Promise<any> {
    const { credential } = body

    const result = await this.commandBus.execute<GoogleLoginCommand, LoginResponseDto>(
      new GoogleLoginCommand(credential, userAgent),
    )
    return { message: 'Login with Google succesfully!', data: result }
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: VerifyEmailBodyDto): Promise<any> {
    const { email, otp } = body

    await this.commandBus.execute<VerifyEmailCommand>(new VerifyEmailCommand(email, otp))
    return { message: 'Verify email succesfully!' }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordBodyDto): Promise<any> {
    const { email } = body

    await this.commandBus.execute<ForgotPasswordCommand>(new ForgotPasswordCommand(email))
    return { message: 'OTP đã được gửi đến email của bạn' }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordBodyDto): Promise<any> {
    const { email, otp, newPassword } = body

    await this.commandBus.execute<ResetPasswordCommand>(new ResetPasswordCommand(email, otp, newPassword))
    return { message: 'Đặt lại mật khẩu thành công' }
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: RefreshTokenBodyDto, @Headers('user-agent') userAgent: string): Promise<any> {
    const { refreshToken } = body

    const result = await this.commandBus.execute<RefreshTokenCommand>(new RefreshTokenCommand(refreshToken, userAgent))
    return { message: 'Refresh token succesfully!', data: result }
  }

  @Post('verify-request')
  @HttpCode(HttpStatus.OK)
  async verify(
    @Headers('Authorization') auth_header: string,
    @Headers('x-original-method') method: string, // Kong forward header
    @Headers('x-original-uri') uri: string, // Kong forward header
  ): Promise<any> {
    const accessToken = auth_header.replace('Bearer ', '').trim()

    const result = await this.commandBus.execute<VerifyRequestCommand, VerifyRequestResponseDto>(
      new VerifyRequestCommand(accessToken, method, uri),
    )

    return result
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Headers('Authorization') auth_header: string, @Headers('user-agent') userAgent: string): Promise<any> {
    const accessToken = auth_header.replace('Bearer ', '').trim()

    await this.commandBus.execute(new LogoutCommand(accessToken, userAgent))

    return { message: 'Logout succesfully!' }
  }
}
