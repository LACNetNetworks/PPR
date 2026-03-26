import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {

  @ApiProperty({
    description: 'Name Task',
    example: 'Upload Evidence',
  })
  @IsString() @IsNotEmpty() name_task: string;
}

