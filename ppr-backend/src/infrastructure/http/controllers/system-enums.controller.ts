import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { SystemEnumsUseCase } from '../../../application/system/system-enums.use-case';
import { AuthGuard,Public} from 'nest-keycloak-connect';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('System Enums')
@Controller('enums')
export class SystemEnumController {
  constructor(private readonly getAllEnums: SystemEnumsUseCase) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all system enums' })
  @ApiResponse({
    status: 200,
    description: 'List of all system enums',
  })
  getAll() {
    return this.getAllEnums.execute();
  }

  @Public()
  @Get(':name')
  @ApiOperation({ summary: 'Get a specific enum by name' })
  @ApiParam({ name: 'name', description: 'Enum name', example: 'ProjectStatus' })
  @ApiResponse({
    status: 200,
    description: 'Enum values',
  })
  @ApiResponse({
    status: 404,
    description: 'Enum not found',
  })
  getOne(@Param('name') name: string) {
    const data = this.getAllEnums.getOne(name);
    if (!data) throw new NotFoundException(`Enum "${name}" no encontrado`);
    return data;
    }
}
