import { Injectable } from "@nestjs/common";
import { isString, Max, MaxLength, Min, MinLength } from "class-validator";

@Injectable()
export class UsernameDto {
    @MinLength(6)
    @MaxLength(100)
    username!: string;
}