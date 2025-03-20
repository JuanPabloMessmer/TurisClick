// Tipos para la entidad Attraction
import { City } from './city';
import { Category } from './category';
import { User } from './user';

export interface Attraction {
  id: number;
  name: string;
  description: string;
  opening_time: string;
  closing_time: string;
  location: string;
  latitude: number;
  longitude: number;
  googleMapsUrl?: string;
  images?: string[];
  status: string;
  city: City;
  category: Category;
  admin: User;
  allCategories?: Category[];
  attractionCategories?: AttractionCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface AttractionCategory {
  id: number;
  attraction: Attraction;
  category: Category;
} 