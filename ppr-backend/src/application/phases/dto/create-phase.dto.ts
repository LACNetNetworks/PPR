import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePhaseDto {
  @ApiProperty({
    description: 'Phase name',
    example: 'Planning Phase',
  })
  @IsString() @IsNotEmpty() name_phase: string;
  
  @ApiProperty({
    description: 'Brief description of the phase',
    example: 'Initial planning and resource allocation phase',
  })
  @IsString() brief_description: string;
}
