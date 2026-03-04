import { Controller, Post, Body, HttpCode, HttpStatus, Headers   } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { RegisterCommand } from '~/application/commands/register/register.command'
import { LoginCommand } from '~/application/commands/login/login.command'
import { VerifyEmailCommand } from '~/application/commands/verify-email/verify-email.command'
import { RefreshTokenCommand } from '~/application/commands/refresh-token/refresh-token.command'
import { VerifyRequestCommand } from '~/application/commands/verify-request/verify-request.command'
import { LogoutCommand } from '~/application/commands/logout/logout.command'
import { 
  RegisterBodyDto, 
  RegisterResponseDto, 
  LoginBodyDto,
  LoginResponseDto,
  VerifyEmailBodyDto,
  RefreshTokenBodyDto,
  VerifyRequestResponseDto,
} from '~/presentation/dtos/user.dto'

@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
  ) {}

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
  async login(
    @Body() body: LoginBodyDto,
    @Headers('user-agent') userAgent: string,
  ): Promise<any> {
    const { email, password } = body

    const result = await this.commandBus.execute<LoginCommand, LoginResponseDto>(
      new LoginCommand(email, password, userAgent),
    )
    return { message: 'Login succesfully!', data: result }
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: VerifyEmailBodyDto): Promise<any> {
    const { email, otp } = body

    await this.commandBus.execute<VerifyEmailCommand>(
      new VerifyEmailCommand(email, otp),
    )
    return { message: 'Verify email succesfully!' }
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() body: RefreshTokenBodyDto,
    @Headers('user-agent') userAgent: string,
  ): Promise<any> {
    const { refreshToken } = body
    // console.log('refreshToken', refreshToken)

    const result = await this.commandBus.execute<RefreshTokenCommand>(
      new RefreshTokenCommand(refreshToken, userAgent),
    )
    return { message: 'Refresh token succesfully!', data: result }
  }

  @Post('verify-request')
  @HttpCode(HttpStatus.OK)
  async verify(
    @Headers('Authorization') auth_header: string
  ): Promise<any> {
    // Bỏ cái Bearer đi
    const accessToken = auth_header.replace('Bearer ', '').trim()
    
    const result = await this.commandBus.execute<VerifyRequestCommand, VerifyRequestResponseDto>(
      new VerifyRequestCommand(accessToken),
    )

    return result 
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Headers('Authorization') auth_header: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<any> {
    const accessToken = auth_header.replace('Bearer ', '').trim()
    
    await this.commandBus.execute<VerifyRequestCommand, VerifyRequestResponseDto>(
      new LogoutCommand(accessToken, userAgent),
    )

    return { message: 'Logout succesfully!' }
  }
}


