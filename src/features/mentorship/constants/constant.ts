// mentorDashboard/constant/constants.ts
import {
  User, Briefcase, Calendar, Clock, CreditCard, Star, LayoutDashboard,
  Bell, Package, BarChart3, Award, Users, Shield, Video, MessageSquare,
  HelpCircle,
} from 'lucide-react';

export const MENU_ITEMS = [
  { id: 'profile',      label: 'Profile',      icon: User },
  { id: 'services',     label: 'Services',     icon: Briefcase },
  { id: 'booking',      label: 'Booking',      icon: Calendar },
  { id: 'queries',      label: 'Queries',      icon: HelpCircle },
  { id: 'availability', label: 'Availability', icon: Clock },
  { id: 'payment',      label: 'Payment',      icon: CreditCard },
  { id: 'review',       label: 'Review',       icon: Star },
  { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'notification', label: 'Notification', icon: Bell },
  { id: 'marketing',    label: 'Marketing Kit', icon: Package },
  { id: 'analytics',    label: 'Analytics',    icon: BarChart3 },
  { id: 'plans',        label: 'Plans',        icon: Award },
  { id: 'trust',        label: 'Trust Score',  icon: Shield },
  { id: 'community',    label: 'Community',    icon: Users },
] as const;

export const SERVICE_TYPES = [
  { name: '1-to-1 Call',   icon: Video,         description: 'Personal mentoring sessions', emoji: '🎯' },
  { name: 'Workshop',      icon: Users,         description: 'Group learning sessions',     emoji: '👥' },
  { name: 'Package',       icon: Package,       description: 'Bundled services',            emoji: '📦' },
  { name: 'Priority DM',   icon: MessageSquare, description: 'Direct messaging support',    emoji: '⚡' },
] as const;