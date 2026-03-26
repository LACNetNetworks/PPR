import { Controller, Get, Query, BadRequestException, Post,Body,UseGuards } from '@nestjs/common';
import { PokService } from '../../integrations/pok/pok.service';
import { AuthenticatedUser, AuthGuard,Public } from 'nest-keycloak-connect';
import { KeycloakSyncGuard } from '../../../infrastructure/auth/keycloak-sync.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SuccessResponseDto, ErrorResponseDto } from '../dto/common-response.dto';
import { GetVcsAndEnqueueTitlesSyncUseCase } from '../../../application/integrations/pok/use-cases/get-vc-and-enqueue-sync.usecase';

/*

@ApiTags('POK (Proof of Knowledge)')
@Controller('pok')
@Public()
export class PokController {
  constructor(
    private readonly pok: PokService,
    private readonly vc: GetVcsAndEnqueueTitlesSyncUseCase,
  ) {}


@Post('credentials')
@UseGuards(AuthGuard, KeycloakSyncGuard)
async credentials(@AuthenticatedUser() user: any) {
  const requestedBy = user?.sub ?? user?.email;
  const { jobId,total} = await this.vc.execute(requestedBy);
  return {
    Success: true,
    sync: { jobId,total, status: 'PENDING' },
  };
}




   @Get('credentials')
  @UseGuards(AuthGuard,KeycloakSyncGuard)
  @ApiOperation({ summary: 'Get POK credentials for authenticated user' })
  @ApiBearerAuth('keycloak')
  @ApiResponse({ status: 200, description: 'POK credentials retrieved successfully', type: SuccessResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  async credentials(@AuthenticatedUser() user: any) {
    const data = await this.pok.getCredentialsByEmail(user.email);
    return { Success: true, data };
  } 

@Post('credentials')
  async credentials(@AuthenticatedUser() user: any) {
    const data = await this.pok.getCredentialsByEmail(user.email);
    return { Success: true, data };
  }
 
}
 */