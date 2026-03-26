import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { UserRole} from '../../../domain/users/user-role.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectUserDto {

  @ApiProperty({
    description: 'Id User',
    example: 'usr_001',
  })
  @IsString() id_user: string;
}
