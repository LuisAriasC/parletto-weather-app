import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class GetGeocodeQuery {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[\p{L}\p{N}\s,.\-']+$/u, {
    message: 'q must contain only letters, numbers, spaces, commas, periods, hyphens, or apostrophes',
  })
  q!: string;
}
