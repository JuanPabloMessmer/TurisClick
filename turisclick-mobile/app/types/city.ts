// Tipos para la entidad City
import { Department } from './department';

export interface City {
  id: number;
  name: string;
  department: Department;
  createdAt?: string;
  updatedAt?: string;
} 