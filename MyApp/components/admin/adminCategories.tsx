import React from 'react';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import type { AdminCategory } from '../../services/adminService';

export interface AdminCategoryConfig {
  id: AdminCategory;
  name: string;
  icon: React.ReactElement;
}

export const ADMIN_CATEGORIES: AdminCategoryConfig[] = [
  { id: 'users', name: 'Estudiantes', icon: <Ionicons name="person-outline" size={24} color="#b388ff" /> },
  { id: 'mentors', name: 'Mentores', icon: <FontAwesome5 name="chalkboard-teacher" size={22} color="#b388ff" /> },
  { id: 'posts', name: 'Posts', icon: <MaterialCommunityIcons name="post-outline" size={24} color="#b388ff" /> },
  { id: 'locations', name: 'Ubicaciones', icon: <MaterialIcons name="location-on" size={24} color="#b388ff" /> },
  { id: 'forums', name: 'Foros', icon: <MaterialCommunityIcons name="forum-outline" size={24} color="#b388ff" /> },
];
