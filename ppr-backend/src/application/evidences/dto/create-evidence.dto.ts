import { IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEvidenceDto {
  @ApiProperty({
    description: 'Project ID associated with the evidence',
    example: 'prj_001',
  })
  @IsString()
  id_project!: string;
  
   @ApiProperty({
    description: 'User ID who uploaded the evidence',
    example: 'usr_001',
  })
  @IsString()
  id_user!: string;

  @ApiProperty({
    description: 'PhaseProject ID asociated with the evidence',
    example: 'pp_001',
  })
  @IsString()
  id_phase_project: string;

  @ApiProperty({
    description: 'PhaseProjectTask ID asociated with the evidence',
    example: 'ppt_001',
  })
  @IsString()
  id_phase_project_task?: string;

}