import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store/store';

export const selectConsultationState = (state: RootState) => state.consultation;

export const selectDoctors = createSelector(
  [selectConsultationState],
  (state) => state.doctors
);

export const selectSelectedDoctor = createSelector(
  [selectConsultationState],
  (state) => state.selectedDoctor
);

export const selectSlots = createSelector(
  [selectConsultationState],
  (state) => state.slots
);

export const selectSelectedSlot = createSelector(
  [selectConsultationState],
  (state) => state.selectedSlot
);

export const selectUpcomingBookings = createSelector(
  [selectConsultationState],
  (state) => state.upcomingBookings
);

export const selectActiveSpecialty = createSelector(
  [selectConsultationState],
  (state) => state.activeSpecialty
);

export const selectIsConsultationLoading = createSelector(
  [selectConsultationState],
  (state) => state.isLoading
);

export const selectConsultationError = createSelector(
  [selectConsultationState],
  (state) => state.error
);

