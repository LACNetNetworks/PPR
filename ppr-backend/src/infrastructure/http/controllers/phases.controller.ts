import { Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards ,BadRequestException,Req} from '@nestjs/common';
import { CreatePhaseDto } from '../../../application/phases/dto/create-phase.dto';
import { CreatePhaseUseCase } from '../../../application/phases/use-cases/create-phase.usecase';
//import { KeycloakJwtAuthGuard } from '../../auth/keycloak.guard';
import { AuthGuard,Public} from 'nest-keycloak-connect';
import { PhaseRepository } from '../../../domain/phases/phase.repository';
//import { CreatePhaseProjectTaskDto } from '../../../application/phases/dto/create-phase-project-task.dto';
import { CreatePhaseProjectTaskUseCase } from 'src/application/phases/use-cases/create-phase-project-task.usecase';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SuccessResponseDto, PaginatedResponseDto, ErrorResponseDto } from '../dto/common-response.dto';
import { TransactionTypes } from '../../../domain/transactions/transaction-types.enum';

@ApiTags('Phases')
@Controller('phases')
export class PhasesController {
  constructor(
    private readonly createPhase: CreatePhaseUseCase,
    private readonly repo: PhaseRepository,
  //  private readonly createPhaseProjectTask: CreatePhaseProjectTaskUseCase,
  ) {}

  //@UseGuards(AuthGuard)
  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new phase' })
  @ApiBody({ type: CreatePhaseDto })
  @ApiResponse({ status: 201, description: 'Phase created successfully', type: SuccessResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request', type: ErrorResponseDto })
  async create(@Body() dto: CreatePhaseDto, @Req() req: Request & { transactionType?: TransactionTypes }) {
    req.transactionType = TransactionTypes.ADD_PHASE;
    const Phase = await this.createPhase.execute(dto);
    if (!Phase) { throw new BadRequestException (`Phase could'nt create`) };
    return { Success: true, data: Phase };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get phase by ID' })
  @ApiParam({ name: 'id', description: 'Phase ID', example: 'phase_001' })
  @ApiResponse({ status: 200, description: 'Phase found', type: SuccessResponseDto })
  @ApiResponse({ status: 404, description: 'Phase not found', type: ErrorResponseDto })
  async byId(@Param('id') id: string) {
    const phase = await this.repo.findById(id);
    if (!phase) { throw new NotFoundException(`Phase with id '${id}' not found`) };
    return { Success: true, data: phase};
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all phases with pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page', example: 50 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of items to skip', example: 0 })
  @ApiResponse({ status: 200, description: 'List of phases', type: PaginatedResponseDto })
  async list(@Query('limit') limit:50, @Query('offset') offset = 0) {
    const data = await this.repo.findAll({ limit: +limit, offset:+offset});
    return { Success: true, data, filters: { limit: +limit, offset: +offset} };
  }

/*   @Public()
  @Post(':phaseId/task')
  async addTaskToPhase(@Param('phaseId') phaseId: string, @Body() dto: CreatePhaseProjectTaskDto) {
  const task= await this.createPhaseProjectTask.execute(phaseId, dto as any);
  if (!task) { throw new BadRequestException(`User couldn't update`) };
  return { Success: true, data: task };
  } */


/*@Public()
  @Get(':phaseId/tasks')
    async getTaskOfPhase(@Param('phaseId') phaseId: string) {
    const tasks= await this.repo.findTaskById(phaseId);
    if (!tasks) { throw new NotFoundException(`Phase with id '${phaseId}' not found`) };
    return { Success: true, data: tasks};  
  } */
}
