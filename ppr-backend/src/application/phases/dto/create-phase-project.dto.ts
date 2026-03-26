import { IsDateString, IsEnum, IsNotEmpty, IsBoolean, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectTypes } from '../../../domain/projects/project-types.enum';
import { PhaseProjectStatus } from '../../../domain/phases/phase-project-status.enum';


export class CreatePhaseProjectDto {
  @ApiProperty({
    description: 'Phase ID associated with a project',
    example: 'pha_007',
  })
  @IsString() id_phase: string;

  @ApiProperty({
    description: 'True if evidence must be supplied.',
    example: 'True/False',
  })
  @IsBoolean() require_evidence: boolean;
  @ApiProperty({
    description: 'Phase status within the project',
    example: 'prj_001',
  })
  @IsEnum(PhaseProjectStatus) status: PhaseProjectStatus;

  @ApiProperty({
    description: 'Indicates the order of the stage within the project',
    example: '2',
  })
  @IsNumber() order: number;

  @ApiProperty({
    description: 'Indicates the stage_weight as a percentage of the entire project scope.',
    example: '2',
  })
  @IsNumber() stage_weight: number;
  
  @ApiProperty({
    description: 'Required monetary amount or contribution for this stage',
    example: '70000',
  })
  @IsNumber() contribution_required: number;
  @ApiProperty({
    description: 'Received monetary amount or contribution for this stage. ',
    example: '60000',
  })
  @IsNumber() contribution_received: number;
}
