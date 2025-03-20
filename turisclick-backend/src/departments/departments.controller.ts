import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    const department = await this.departmentsService.create(createDepartmentDto);
    return {
      status: 'success',
      message: 'Departamento creado exitosamente',
      data: department,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    const departments = await this.departmentsService.findAll();
    return {
      status: 'success',
      message: 'Departamentos obtenidos exitosamente',
      data: departments,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const department = await this.departmentsService.findOne(+id);
    return {
      status: 'success',
      message: 'Departamento obtenido exitosamente',
      data: department,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
    const department = await this.departmentsService.update(+id, updateDepartmentDto);
    return {
      status: 'success',
      message: `Departamento con ID ${id} actualizado exitosamente`,
      data: department,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.departmentsService.remove(+id);
    return {
      status: 'success',
      message: `Departamento con ID ${id} eliminado exitosamente`,
    };
  }
}
