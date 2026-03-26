import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsNotEmpty, IsString } from 'class-validator';

export class DeployTokenDto {
  @ApiProperty({ example: 'Token Seguro', description: 'Token name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'TKN', description: 'Token symbol' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

/*   @ApiProperty({ example: '0x1234...abcd', description: 'Admin address (DEFAULT_ADMIN_ROLE)' })
  @IsEthereumAddress()
  admin: string;

  @ApiProperty({ example: '0x1234...abcd', description: 'Minter address (MINTER_ROLE)' })
  @IsEthereumAddress()
  minter: string; */
}
