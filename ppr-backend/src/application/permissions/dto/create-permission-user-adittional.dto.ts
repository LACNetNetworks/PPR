import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PhaseProjectTaskStatus } from '../../../domain/phases/phase-project-task-status.enum';

export class CreatePermissionUserAdittionalDto {
  @ApiProperty({
    description: "User Id ",
    example: 'usr_001',
  })
  @IsString() id_user: string;
  @ApiProperty({
    description: "Permission Id ",
    example: 'per_001',
  })
  @IsString() id_permission: string;
  @ApiProperty({
    description: "Status task associated phase",
    example: 'pending',
  })
  @IsBoolean() type: boolean;
}