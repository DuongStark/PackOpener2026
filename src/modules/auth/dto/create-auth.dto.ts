import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAuthDto {
  @IsEmail()
  @IsDefined({ message: 'Email is required' })
  email!: string;

  @IsString()
  @IsDefined({ message: 'Password is required' })
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/, {
    message: 'Username phải có cả chữ và số, không chứa ký tự đặc biệt',
  })
  username!: string;
}
