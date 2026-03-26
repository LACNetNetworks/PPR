import { IsDateString, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContributionDto {

  @ApiProperty({
    description: 'Project Id',
    example: 'prj_001',
  })
  @IsString() id_project: string;
  @ApiProperty({
    description: 'User Id',
    example: 'usr_001',
  })
  @IsString() id_user: string;
  @ApiProperty({
    description: 'Amount of money contributed',
    example: '120000',
  })
  @IsNumber() @Min(0) deposit_amount: number;
  @ApiProperty({
    description: 'Id Project Phase',
    example: 'pp_0001',
  })
  @IsString() id_phase_project: string;
  @ApiProperty({
    description: 'Deposit or Transfer date',
    example: '2026-01-01',
  })
  @IsDateString() date_contribution: Date;
}