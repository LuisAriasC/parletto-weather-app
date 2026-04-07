import { IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Units } from '@palmetto/shared';

export class GetWeatherQuery {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9\s,.\-]+$/, {
    message: 'location must contain only letters, numbers, spaces, commas, periods, or hyphens',
  })
  location!: string;

  @IsOptional()
  @IsIn(['imperial', 'metric'])
  units?: Units = 'imperial';
}
