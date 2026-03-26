import { Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards ,BadRequestException} from '@nestjs/common';
import { CreatePhaseProjectDto } from '../../../application/phases/dto/create-phase-project.dto';
import { CreatePhaseProjectUseCase } from '../../../application/phases/use-cases/create-phase-project.usecase';
//import { KeycloakJwtAuthGuard } from '../../auth/keycloak.guard';
import { AuthGuard,Public} from 'nest-keycloak-connect';
import { PhaseRepository } from '../../../domain/phases/phase.repository';
import {CreatePhaseProjectTaskUseCase} from '../../../application/phases/use-cases/create-phase-project-task.usecase';
import { CreatePhaseProjectTaskDto } from '../../../application/phases/dto/create-phase-project-task.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SuccessResponseDto, PaginatedResponseDto, ErrorResponseDto } from '../dto/common-response.dto';

@ApiTags('Phase Projects')
@Controller('phases-projects')
export class PhasesProjectController {
  constructor(
    private readonly createPhaseProjectTask: CreatePhaseProjectTaskUseCase,
  ) {}

  //@UseGuards(AuthGuard)
/*   @Public()
  @Post(':phaseProjectId/tasks')
  async createTaskToPhase(@Param('phaseProjectId') phaseProjectId: string, @Body() dto: CreatePhaseProjectTaskDto) {
    const updated = await this.createPhaseProjectTask.execute(phaseProjectId, dto as any);
    if (!updated) { throw new BadRequestException(`User couldn't update`) };
    return { Success: true, data: updated };
  } */
}
