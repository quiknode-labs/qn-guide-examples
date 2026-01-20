import { create } from 'zustand';
import type { User, ActivityLog } from '@/types';

interface AppState {
  users: User[];
  activities: ActivityLog[];
  isConnected: boolean;
  setUsers: (users: User[]) => void;
  addActivity: (activity: ActivityLog) => void;
  setConnected: (connected: boolean) => void;
  removeUser: (id: string) => void;
  addUser: (user: User) => void;
}

export const useAppStore = create<AppState>((set) => ({
  users: [],
  activities: [],
  isConnected: false,
  setUsers: (users) => set({ users }),
  addActivity: (activity) =>
    set((state) => ({
      activities: [activity, ...state.activities].slice(0, 50)
    })),
  setConnected: (isConnected) => set({ isConnected }),
  removeUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== id)
    })),
  addUser: (user) =>
    set((state) => ({
      users: [user, ...state.users]
    })),
}));
