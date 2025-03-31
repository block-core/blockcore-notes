import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';

export const AuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const appState = inject(ApplicationState);

  if (!appState.authenticated()) {
    router.navigate(['/connect']);
    return false;
  }
  
  return true;
};
