import { Body, Controller, Post } from '@nestjs/common';
import { EvidenceBlockchainPort } from '../../../application/integrations/ports/evidence.blockchain.port';
import { AuthGuard,Public } from 'nest-keycloak-connect';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SuccessResponseDto, ErrorResponseDto } from '../dto/common-response.dto';

@ApiTags('Blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(
    private readonly chain: EvidenceBlockchainPort
  ) {}

  @Public()
  @Post('deploy/evidence')
  @ApiOperation({ summary: 'Deploy blockchain certification contract' })
  @ApiResponse({ status: 201, description: 'Blockchain contract deployed successfully', type: SuccessResponseDto })
  @ApiResponse({ status: 500, description: 'Internal server error', type: ErrorResponseDto })
  async deployContractEvidence() {
    const res = await this.chain.deployCertification();
    return { Success: true, data: res };
  }

}
