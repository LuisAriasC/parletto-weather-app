import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class GetGeocodeQuery {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  q!: string;
}
