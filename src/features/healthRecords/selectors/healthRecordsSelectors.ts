import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store/store';
import { HealthRecord } from '../types/healthRecordTypes';

export const selectHealthRecordsState = (state: RootState) => state.healthRecords;

export const selectAllRecords = createSelector(
  [selectHealthRecordsState],
  (state) => state.records
);

export const selectSelectedCategory = createSelector(
  [selectHealthRecordsState],
  (state) => state.selectedCategory
);

export const selectSearchQuery = createSelector(
  [selectHealthRecordsState],
  (state) => state.searchQuery
);

export const selectSelectedRecord = createSelector(
  [selectHealthRecordsState],
  (state) => state.selectedRecord
);

export const selectIsLoading = createSelector(
  [selectHealthRecordsState],
  (state) => state.isLoading
);

export const selectError = createSelector(
  [selectHealthRecordsState],
  (state) => state.error
);

// Memoized selector for filtered records
export const selectFilteredRecords = createSelector(
  [selectAllRecords, selectSelectedCategory, selectSearchQuery],
  (records, category, query) => {
    let result = records;

    if (category && category !== 'All') {
      result = result.filter((r) => r.category.toLowerCase() === category.toLowerCase());
    }

    if (query && query.trim().length > 0) {
      const q = query.toLowerCase().trim();
      result = result.filter((r) => {
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesDoctor = r.doctorName?.toLowerCase().includes(q) || false;
        const matchesFacility = r.facilityName?.toLowerCase().includes(q) || false;
        const matchesNotes = r.notes?.toLowerCase().includes(q) || false;
        const matchesTags = r.tags?.some((tag) => tag.toLowerCase().includes(q)) || false;
        
        return matchesTitle || matchesDoctor || matchesFacility || matchesNotes || matchesTags;
      });
    }

    return result;
  }
);

// Interface for grouped timelines
export interface GroupedSection {
  title: string; // e.g. "August 2026"
  year: string;
  month: string;
  data: HealthRecord[];
}

// Selector to group filtered records by Month and Year
export const selectGroupedRecords = createSelector(
  [selectFilteredRecords],
  (filteredRecords) => {
    const groups: Record<string, HealthRecord[]> = {};

    // Group items by "Month Year"
    filteredRecords.forEach((record) => {
      // Parse record date (format: "DD/MM/YYYY")
      const parts = record.date.split('/');
      let year = 'Unknown';
      let monthName = 'Unknown';

      if (parts.length === 3) {
        year = parts[2];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        monthName = months[monthIndex] || 'Unknown';
      }

      const key = `${monthName} ${year}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(record);
    });

    // Convert groups to sorted array of GroupedSection
    const sections: GroupedSection[] = Object.keys(groups).map((key) => {
      const [month, year] = key.split(' ');
      return {
        title: key,
        month,
        year,
        data: groups[key],
      };
    });

    // Sort sections chronologically (most recent first)
    sections.sort((a, b) => {
      const yearA = parseInt(a.year, 10) || 0;
      const yearB = parseInt(b.year, 10) || 0;
      
      if (yearA !== yearB) {
        return yearB - yearA;
      }

      // Convert month names back to indices
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const indexA = months.indexOf(a.month);
      const indexB = months.indexOf(b.month);

      return indexB - indexA;
    });

    return sections;
  }
);

