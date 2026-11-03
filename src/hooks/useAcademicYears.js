import { useQuery } from "@tanstack/react-query";
import { academicYearsService } from "../services/academicYearsService";

export function useActiveAcademicYear() {
  return useQuery({
    queryKey: ["academic-years", "active"],
    queryFn: academicYearsService.getActiveAcademicYear,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAcademicYears() {
  return useQuery({
    queryKey: ["academic-years", "list"],
    queryFn: academicYearsService.getAcademicYears,
    staleTime: 5 * 60 * 1000,
  });
}
