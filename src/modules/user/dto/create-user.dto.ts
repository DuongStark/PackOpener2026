import { IsEmail, IsString, Matches, MaxLength, Min, MinLength } from "class-validator";

export class CreateUserDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(6)
    password!: string;

    @IsString()
    @MinLength(6)
    @MaxLength(20)
     @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/, {
    message: "Username phải có cả chữ và số, không chứa ký tự đặc biệt",
  })
    username!: string;

}
