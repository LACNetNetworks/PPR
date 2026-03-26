import { BadRequestException, Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TokenBlockchainPort } from '../../../application/integrations/ports/token.blockchain.port';
import { DeployTokenDto } from '../dto/token/deploy-token.dto';
import { MintTokenDto } from '../dto/token/mint-token.dto';
import { GrantRoleDto } from '../dto/token/grant-role.dto';
import { AuthGuard,Public} from 'nest-keycloak-connect';

@ApiTags('TokenPPR')
//@ApiBearerAuth('keycloak')
@Controller('tokens') 
export class TokensController {
  constructor(private readonly token: TokenBlockchainPort) {}

  @Public()
  @Post('deploy')
  @ApiOperation({ summary: 'Deploy TokenPPR contract' })
  async deploy(@Body() dto: DeployTokenDto) {
    const res = await this.token.deployToken({
      name: dto.name,
      symbol: dto.symbol,
    });
    return { Success: true, data: res };
  }

/*   async deploy(@Body() dto: DeployTokenDto) {
    const res = await this.token.deployToken({
      name: dto.name,
      symbol: dto.symbol,
      admin: dto.admin,
      minter: dto.minter,
    });
    return { Success: true, data: res };
  } */


/*   @Public() 
  @Post('mint')
  @ApiOperation({ summary: 'Mint tokens (audited) to an address' })
  async mint(@Body() dto: MintTokenDto) {
    let amount: bigint;
    try {
      amount = BigInt(dto.amount);
    } catch {
      throw new BadRequestException('amount must be a numeric string');
    }

    const res = await this.token.mint({
      contractAddress: dto.contractAddress,
      to: dto.to,
      amount,
      uid: dto.uid,
      context: dto.context,
    });

    return { Success: true, data: res };
  } */

  @Public()
  @Post('roles/minter/grant')
  @ApiOperation({ summary: 'Grant MINTER_ROLE to an address' })
  async grantMinter(@Body() dto: GrantRoleDto) {
    const res = await this.token.grantMinter({
      contractAddress: dto.contractAddress,
      account: dto.account,
    });
    return { Success: true, data: res };
  }

  @Public()
  @Post('roles/transferer/grant')
  @ApiOperation({ summary: 'Grant TRANSFER_ROLE to an address' })
  async grantTransferer(@Body() dto: GrantRoleDto) {
    const res = await this.token.grantTransferer({
      contractAddress: dto.contractAddress,
      account: dto.account,
    });
    return { Success: true, data: res };
  }


  @Public()
  @Get(':contractAddress/balance/:account')
  @ApiOperation({ summary: 'Get ERC20 balanceOf for an account' })
  async balanceOf(
    @Param('contractAddress') contractAddress: string,
    @Param('account') account: string,
  ) {
    const bal = await this.token.balanceOf({ contractAddress, account });
    return { Success: true, data: { balance: bal.toString() } };
  }

}
