export type ClothingCategory = 'Top' | 'Bottom' | 'Outerwear' | 'Shoes' | 'One-Piece' | 'Accessory' | 'Other';

export interface ClothingItem {
  id: string;
  imageUrl: string;
  category: ClothingCategory;
  color: string;
  season: string;
  description: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  link?: string;
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}

export interface Outfit {
  id: string;
  itemIds: string[];
  vibe: string;
  explanation: string;
}

export interface WeeklyPlan {
  [day: string]: Outfit;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  time: string;
  icon: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  WARDROBE = 'WARDROBE',
  STYLIST = 'STYLIST',
  WISHLIST = 'WISHLIST',
}
