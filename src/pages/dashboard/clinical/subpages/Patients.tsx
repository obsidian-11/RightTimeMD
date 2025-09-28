import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  Search,
  Filter,
  UserPlus,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useClinic } from "@/hooks";
import { useDebounce } from "@/hooks";

const PAGE_SIZE = 25;

export function Patients() {
  const { currentClinic } = useClinic();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("lastname");
  const [currentPage, setCurrentPage] = useState(1);
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Debounce search to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Query for patients with pagination
  const {
    data: paginatedData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "patients",
      currentClinic?.id,
      debouncedSearchTerm,
      sortBy,
      currentPage,
      ageFilter,
      dateFilter,
    ],
    queryFn: async () => {
      if (!currentClinic?.id) return { patients: [], total: 0 };

      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("patient")
        .select(
          "id, firstname, lastname, mrn, email, phone_primary, date_of_birth, created_at",
          { count: "exact" },
        )
        .eq("clinic_id", currentClinic.id)
        .range(from, to);

      // Apply search filter
      if (debouncedSearchTerm) {
        query = query.or(
          `firstname.ilike.%${debouncedSearchTerm}%,lastname.ilike.%${debouncedSearchTerm}%,mrn.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%`,
        );
      }

      // Apply age filter
      if (ageFilter !== "all") {
        const today = new Date();
        if (ageFilter === "0-17") {
          const maxDate = new Date(
            today.getFullYear() - 0,
            today.getMonth(),
            today.getDate(),
          );
          const minDate = new Date(
            today.getFullYear() - 18,
            today.getMonth(),
            today.getDate(),
          );
          query = query
            .gte("date_of_birth", minDate.toISOString())
            .lte("date_of_birth", maxDate.toISOString());
        } else if (ageFilter === "18-64") {
          const maxDate = new Date(
            today.getFullYear() - 18,
            today.getMonth(),
            today.getDate(),
          );
          const minDate = new Date(
            today.getFullYear() - 65,
            today.getMonth(),
            today.getDate(),
          );
          query = query
            .gte("date_of_birth", minDate.toISOString())
            .lte("date_of_birth", maxDate.toISOString());
        } else if (ageFilter === "65+") {
          const maxDate = new Date(
            today.getFullYear() - 65,
            today.getMonth(),
            today.getDate(),
          );
          query = query.lte("date_of_birth", maxDate.toISOString());
        }
      }

      // Apply date filter
      if (dateFilter !== "all") {
        const today = new Date();
        if (dateFilter === "last-30") {
          const thirtyDaysAgo = new Date(
            today.getTime() - 30 * 24 * 60 * 60 * 1000,
          );
          query = query.gte("created_at", thirtyDaysAgo.toISOString());
        } else if (dateFilter === "last-90") {
          const ninetyDaysAgo = new Date(
            today.getTime() - 90 * 24 * 60 * 60 * 1000,
          );
          query = query.gte("created_at", ninetyDaysAgo.toISOString());
        } else if (dateFilter === "last-year") {
          const oneYearAgo = new Date(
            today.getFullYear() - 1,
            today.getMonth(),
            today.getDate(),
          );
          query = query.gte("created_at", oneYearAgo.toISOString());
        }
      }

      // Apply sorting
      const isAscending = true;
      switch (sortBy) {
        case "firstname":
          query = query.order("firstname", { ascending: isAscending });
          break;
        case "lastname":
          query = query.order("lastname", { ascending: isAscending });
          break;
        case "created_at":
          query = query.order("created_at", { ascending: !isAscending });
          break;
        case "mrn":
          query = query.order("mrn", {
            ascending: isAscending,
            nullsFirst: false,
          });
          break;
        default:
          query = query.order("lastname", { ascending: isAscending });
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        patients: data || [],
        total: count || 0,
      };
    },
    enabled: !!currentClinic?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading new page
  });

  const patients = paginatedData?.patients || [];
  const totalPatients = paginatedData?.total || 0;
  const totalPages = Math.ceil(totalPatients / PAGE_SIZE);

  // Generate MRN if missing - MRN is Medical Record Number, unique patient identifier
  const generateMRN = (patient: any) => {
    if (patient.mrn) return patient.mrn;

    // Generate a temporary MRN: "TMP-" prefix + patient initials + last 4 digits of ID
    const firstInitial = patient.firstname?.charAt(0)?.toUpperCase() || "X";
    const lastInitial = patient.lastname?.charAt(0)?.toUpperCase() || "X";
    const idSuffix = patient.id?.slice(-4) || "0000";

    return `TMP-${firstInitial}${lastInitial}${idSuffix}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getAgeFromDOB = (dobString: string) => {
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setAgeFilter("all");
    setDateFilter("all");
    setCurrentPage(1);
  };

  const activeFilterCount = [ageFilter, dateFilter].filter(
    (f) => f !== "all",
  ).length;

  if (!currentClinic) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">
          Please select a clinic to view patients.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-sm text-gray-600">
            Manage patients at {currentClinic.name}
          </p>
        </div>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">
                Search
              </label>
              <div className="relative mt-1">
                <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, MRN, or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-full md:w-48">
              <label className="text-sm font-medium text-gray-700">
                Sort By
              </label>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastname">Last Name</SelectItem>
                  <SelectItem value="firstname">First Name</SelectItem>
                  <SelectItem value="mrn">MRN</SelectItem>
                  <SelectItem value="created_at">Date Added</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative flex-shrink-0"
                >
                  <Filter className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filters</h4>
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="mr-1 h-4 w-4" />
                        Clear
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Age Range</Label>
                      <Select
                        value={ageFilter}
                        onValueChange={(value) => {
                          setAgeFilter(value);
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Ages</SelectItem>
                          <SelectItem value="0-17">Pediatric (0-17)</SelectItem>
                          <SelectItem value="18-64">Adult (18-64)</SelectItem>
                          <SelectItem value="65+">Senior (65+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Added to Clinic
                      </Label>
                      <Select
                        value={dateFilter}
                        onValueChange={(value) => {
                          setDateFilter(value);
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="last-30">Last 30 Days</SelectItem>
                          <SelectItem value="last-90">Last 90 Days</SelectItem>
                          <SelectItem value="last-year">Last Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Patient List</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{totalPatients} total patients</Badge>
              <Badge variant="outline">
                Page {currentPage} of {totalPages}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex h-32 items-center justify-center text-red-600">
              Error loading patients: {error.message}
            </div>
          ) : patients && patients.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>MRN</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient: any) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-medium text-blue-600">
                            {patient.firstname?.charAt(0) || "U"}
                            {patient.lastname?.charAt(0) || "N"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {patient.firstname || "Unknown"}{" "}
                              {patient.lastname || "Patient"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {patient.email || "No email provided"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            {generateMRN(patient)}
                          </span>
                          {!patient.mrn && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              title="Temporary MRN - Medical Record Number auto-generated from patient info"
                            >
                              Temp
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {patient.date_of_birth
                          ? getAgeFromDOB(String(patient.date_of_birth))
                          : "—"}
                      </TableCell>
                      <TableCell>{patient.phone_primary || "—"}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {patient.created_at
                          ? formatDate(patient.created_at.toString())
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            to={`/dashboard/clinical/${currentClinic.id}/patients/${patient.id}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
                  {Math.min(currentPage * PAGE_SIZE, totalPatients)} of{" "}
                  {totalPatients} patients
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      const isActive = page === currentPage;

                      return (
                        <Button
                          key={page}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="h-8 w-8"
                        >
                          {page}
                        </Button>
                      );
                    })}

                    {totalPages > 5 && (
                      <>
                        {currentPage < totalPages - 2 && (
                          <span className="px-2">...</span>
                        )}
                        <Button
                          variant={
                            currentPage === totalPages ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className="h-8 w-8"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-32 flex-col items-center justify-center text-gray-500">
              <p className="text-lg font-medium">No patients found</p>
              <p className="text-sm">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "Start by adding your first patient"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
