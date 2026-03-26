import { Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards ,BadRequestException} from '@nestjs/common';
import { CreateAuditRevisionDto } from '../../../application/audit-revisions/dto/create-audit-revision.dto';
import { CreateAuditRevisionUseCase } from '../../../application/audit-revisions/use-cases/create-audit-revision.usecase';
import { AuthGuard,Public,Roles } from 'nest-keycloak-connect';
import { AuditRevisionRepository } from '../../../domain/audit-revisions/audit-revision.repository';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SuccessResponseDto, PaginatedResponseDto, ErrorResponseDto } from '../dto/common-response.dto';

@ApiTags('Audit Revisions')
@Controller('audit')
export class AuditRevisionsController {
  constructor(
    private readonly createAuditRevision: CreateAuditRevisionUseCase,
    private readonly repo: AuditRevisionRepository,

  ) {}

  //@UseGuards(AuthGuard)
  @Public()
  //@Roles({ roles: ['verifier'] })
  @Post()
  @ApiOperation({ summary: 'Create a new audit revision' })
  @ApiBody({ type: CreateAuditRevisionDto })
  @ApiResponse({ status: 201, description: 'Audit revision created successfully', type: SuccessResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request', type: ErrorResponseDto })
  async create(@Body() dto: CreateAuditRevisionDto) {
    const AuditRevision = await this.createAuditRevision.execute(dto);
    //if (!AuditRevision) { throw new BadRequestException (`AuditRevision could'nt create`) };
    return { Success: true, data: AuditRevision };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get audit revision by ID' })
  @ApiParam({ name: 'id', description: 'Audit revision ID', example: 'audit_001' })
  @ApiResponse({ status: 200, description: 'Audit revision found', type: SuccessResponseDto })
  @ApiResponse({ status: 404, description: 'Audit revision not found', type: ErrorResponseDto })
  async byId(@Param('id') id: string) {
    const audit = await this.repo.findById(id);
    if (!audit) { throw new NotFoundException(`AuditRevision with id '${id}' not found`) };
    return { Success: true, data: audit};
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all audit revisions with pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page', example: 50 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of items to skip', example: 0 })
  @ApiResponse({ status: 200, description: 'List of audit revisions', type: PaginatedResponseDto })
  async list(@Query('limit') limit:50, @Query('offset') offset = 0) {
    const data = await this.repo.findAll({ limit: +limit, offset:+offset});
    return { Success: true, data, filters: { limit: +limit, offset: +offset} };
  }
}
