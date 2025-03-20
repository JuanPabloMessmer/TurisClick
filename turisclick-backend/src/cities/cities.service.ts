import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { City } from './entities/city.entity';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private cityRepository: Repository<City>,
  ) {}

  create(createCityDto: CreateCityDto) {
    const city = this.cityRepository.create(createCityDto);
    return this.cityRepository.save(city);
  }

  findAll() {
    return this.cityRepository.find({ relations: ['department'] });
  }

  async findByDepartment(departmentId: number) {
    try {
      const cities = await this.cityRepository.find({
        where: { department: { id: departmentId } },
        relations: ['department'],
      });
      
      return {
        status: 'success',
        message: `Ciudades del departamento ${departmentId} obtenidas exitosamente`,
        data: cities,
      };
    } catch (error) {
      throw new Error(`Error al buscar ciudades por departamento: ${error.message}`);
    }
  }

  async findOne(id: number) {
    const city = await this.cityRepository.findOne({
      where: { id },
      relations: ['department'],
    });
    
    if (!city) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }
    
    return city;
  }

  async update(id: number, updateCityDto: UpdateCityDto) {
    const city = await this.findOne(id);
    this.cityRepository.merge(city, updateCityDto);
    return this.cityRepository.save(city);
  }

  async remove(id: number) {
    const city = await this.findOne(id);
    return this.cityRepository.remove(city);
  }
}
