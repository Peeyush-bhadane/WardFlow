'use client';

import { useState, useEffect } from 'react';
import { wardStore, STORE_EVENT_NAME } from './store';
import { WardState, User } from './types';

export function useWardStore() {
  const [state, setState] = useState<WardState>(() => wardStore.getState());
  const [currentUser, setCurrentUser] = useState<User>(() => wardStore.getCurrentUser());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Reload state after mount to ensure browser localStorage is read
    setState({ ...wardStore.getState() });
    setCurrentUser(wardStore.getCurrentUser());

    const handleUpdate = () => {
      setState({ ...wardStore.getState() });
      setCurrentUser(wardStore.getCurrentUser());
    };

    window.addEventListener(STORE_EVENT_NAME, handleUpdate);
    return () => {
      window.removeEventListener(STORE_EVENT_NAME, handleUpdate);
    };
  }, []);

  return {
    state,
    currentUser,
    isMounted,
    wardStore,
    setCurrentUser: (user: User) => wardStore.setCurrentUser(user),
    advanceToNextDay: () => wardStore.advanceToNextDay(),
    resetToDefault: () => wardStore.resetToDefault(),
  };
}
