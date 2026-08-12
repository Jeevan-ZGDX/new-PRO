export interface SectionRegistrationDetail {
  id: string;
  name: string;
  email: string;
  department: string;
  section: string;
 }

export interface CompetitionSectionStats {
  section: string;
  registeredCount: number;
  totalCount: number;
  registered?: SectionRegistrationDetail[];
}

export interface CompetitionSectionsResponse {
  competitionId: string;
  eligibleYears: string[];
  sections: CompetitionSectionStats[];
}
