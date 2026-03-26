import { Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards ,BadRequestException,Req} from '@nestjs/common';
import { CreateContributionDto } from '../../../application/contributions/dto/create-contribution.dto';
import { CreateContributionUseCase } from '../../../application/contributions/use-cases/create-contribution.usecase';
//import { KeycloakJwtAuthGuard } from '../../auth/keycloak.guard';
import { AuthGuard,Public,Roles } from 'nest-keycloak-connect';
import { ContributionRepository } from '../../../domain/contributions/contribution.repository';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SuccessResponseDto, PaginatedResponseDto, ErrorResponseDto } from '../dto/common-response.dto';
import { TransactionTypes } from '../../../domain/transactions/transaction-types.enum';


@ApiTags('Contributions')
@Controller('contributions')
export class ContributionsController {
  constructor(
    private readonly createContribution: CreateContributionUseCase,
    private readonly repo: ContributionRepository,

  ) {}

  //@UseGuards(AuthGuard)
  //@Public()
  @Roles({ roles: ['sponsor'] })
  @Post()
  @ApiOperation({ summary: 'Create a new contribution' })
  @ApiBody({ type: CreateContributionDto })
  @ApiResponse({ status: 201, description: 'Contribution created successfully', type: SuccessResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request', type: ErrorResponseDto })
  //async create(@Body() dto: CreateContributionDto, @Req() req: Request & { transactionType?: TransactionTypes }) {
  async create(@Body() dto: CreateContributionDto , @Req() req: Request & { transactionType?: TransactionTypes } & any) {
    req.transactionType = TransactionTypes.ADD_CONTRIBUTION_PHASE;
    const user = req.user;
    if (!user){
      throw new BadRequestException('User token not found');
    }
    const uid = user.sub;
    const contribution = await this.createContribution.execute({...dto,uid});
    if (!contribution) { throw new BadRequestException (`Contribution could'nt create`) };
    return { Success: true, data: contribution };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get contribution by ID' })
  @ApiParam({ name: 'id', description: 'Contribution ID', example: 'contrib_001' })
  @ApiResponse({ status: 200, description: 'Contribution found', type: SuccessResponseDto })
  @ApiResponse({ status: 404, description: 'Contribution not found', type: ErrorResponseDto })
  async byId(@Param('id') id: string) {
    const org = await this.repo.findById(id);
    if (!org) { throw new NotFoundException(`Contribution with id '${id}' not found`) };
    return { Success: true, data: org};
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all contributions with pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page', example: 50 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of items to skip', example: 0 })
  @ApiResponse({ status: 200, description: 'List of contributions', type: PaginatedResponseDto })
  async list(@Query('limit') limit:50, @Query('offset') offset = 0) {
    const data = await this.repo.findAll({ limit: +limit, offset:+offset});
    return { Success: true, data, filters: { limit: +limit, offset: +offset} };
  }

}
