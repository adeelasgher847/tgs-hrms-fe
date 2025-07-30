import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

import { useOutletContext } from "react-router-dom";
import DesignationModal from "../Desigantions/Designation-modal";
import DeleteConfirmationDialog from "./Delete-confirmation-dialog";
import { useLanguage } from "../../context/LanguageContext";
import { designationApiService, type FrontendDesignation, type FrontendDepartment } from "../../api/designationApi";

export default function DesignationManager() {
  const { language, setLanguage } = useLanguage();
  const isRTL = language === "ar";

  const { darkMode } = useOutletContext<{ darkMode: boolean }>();

  const [designations, setDesignations] = useState<FrontendDesignation[]>([]);
  const [departments, setDepartments] = useState<FrontendDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<FrontendDesignation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [designationToDelete, setDesignationToDelete] = useState<FrontendDesignation | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | "all">("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const getText = (en: string, ar: string) => (language === "ar" ? ar : en);

  // Fetch all departments from backend
  const fetchDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      const backendDepartments = await designationApiService.getAllDepartments();
      const frontendDepartments = backendDepartments.map(department => 
        designationApiService.convertBackendDepartmentToFrontend(department)
      );
      setDepartments(frontendDepartments);
    } catch (error: unknown) {
      console.error("Error fetching departments:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch departments";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setDepartmentsLoading(false);
    }
  };

  // Fetch designations for a specific department
  const fetchDesignations = async (departmentId: string) => {
    try {
      setLoading(true);
      const backendDesignations = await designationApiService.getDesignationsByDepartment(departmentId);
      const frontendDesignations = backendDesignations.map(designation => 
        designationApiService.convertBackendToFrontend(designation)
      );
      setDesignations(frontendDesignations);
    } catch (error: unknown) {
      console.error("Error fetching designations:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch designations";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all designations from all departments
  const fetchAllDesignations = async () => {
    try {
      setLoading(true);
      const backendDesignations = await designationApiService.getAllDesignations();
      const frontendDesignations = backendDesignations.map(designation => 
        designationApiService.convertBackendToFrontend(designation)
      );
      setDesignations(frontendDesignations);
    } catch (error: unknown) {
      console.error("Error fetching all designations:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch all designations";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Load designations when department changes
  useEffect(() => {
    if (selectedDepartmentId !== "all") {
      fetchDesignations(selectedDepartmentId);
    } else {
      fetchAllDesignations();
    }
  }, [selectedDepartmentId]);

  const handleSaveDesignation = async (data: { title: string; titleAr: string }) => {
    try {
      if (editingDesignation) {
        // Update existing designation
        const designationDto = {
          title: data.title,
          departmentId: editingDesignation.departmentId,
        };
        
        const updatedBackendDesignation = await designationApiService.updateDesignation(editingDesignation.id, designationDto);
        const updatedFrontendDesignation = designationApiService.convertBackendToFrontend(updatedBackendDesignation);
        
        // Add Arabic title from form data
        const updatedDesignation: FrontendDesignation = {
          ...updatedFrontendDesignation,
          titleAr: data.titleAr || "",
        };
        
        setDesignations((prev) =>
          prev.map((d) =>
            d.id === editingDesignation.id ? updatedDesignation : d
          )
        );
        
        setSnackbar({
          open: true,
          message: "Designation updated successfully",
          severity: "success",
        });
      } else {
        // Create new designation
        if (selectedDepartmentId === "all") {
          setSnackbar({
            open: true,
            message: "Please select a department first",
            severity: "error",
          });
          return;
        }
        
        const designationDto = {
          title: data.title,
          departmentId: selectedDepartmentId,
        };
        
        const newBackendDesignation = await designationApiService.createDesignation(designationDto);
        const newFrontendDesignation = designationApiService.convertBackendToFrontend(newBackendDesignation);
        
        // Add Arabic title from form data
        const newDesignation: FrontendDesignation = {
          ...newFrontendDesignation,
          titleAr: data.titleAr || "",
        };
        
        setDesignations((prev) => [...prev, newDesignation]);
        
        setSnackbar({
          open: true,
          message: "Designation created successfully",
          severity: "success",
        });
      }
      setModalOpen(false);
      setEditingDesignation(null);
    } catch (error: unknown) {
      console.error("Error saving designation:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save designation";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  };

  const handleDeleteDesignation = async () => {
    if (designationToDelete) {
      try {
        await designationApiService.deleteDesignation(designationToDelete.id);
        setDesignations((prev) =>
          prev.filter((d) => d.id !== designationToDelete.id)
        );
        setSnackbar({
          open: true,
          message: "Designation deleted successfully",
          severity: "success",
        });
      } catch (error: unknown) {
        console.error("Error deleting designation:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to delete designation";
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: "error",
        });
      }
    }
    setDeleteDialogOpen(false);
    setDesignationToDelete(null);
  };

  const filteredDesignations =
    selectedDepartmentId === "all"
      ? designations
      : designations.filter((d) => d.departmentId === selectedDepartmentId);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredDesignations.length / itemsPerPage);
  const paginatedData = filteredDesignations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Container  maxWidth="xl" sx={{ mt: 4 }} dir={isRTL ? "rtl" : "ltr"}>
      {/* Top Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          mb: 3,
          gap: 2,
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: darkMode ? "#fff" : "#000" }}
        >
          {getText("Designations", "المسميات الوظيفية")}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <ToggleButtonGroup
            size="small"
            value={language}
            exclusive
            onChange={(_, newLang) => {
              if (newLang !== null) {
                setLanguage(newLang);
              }
            }}
            sx={{ height: 36 }}
          >
            <></> {/* Placeholder */}
          </ToggleButtonGroup>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingDesignation(null);
              setModalOpen(true);
            }}
            sx={{
              minWidth: 200,
              fontWeight: 600,
              py: 1,
              backgroundColor: "#464b8a",
            }}
          >
            {getText("Create Designation", "إنشاء مسمى وظيفي")}
          </Button>
        </Box>
      </Box>

      {/* Filter by Department */}
      <Card sx={{ mb: 3, backgroundColor: darkMode ? "#222" : "#fff" }}>
        <CardContent>
          <FormControl fullWidth>
            <InputLabel
              id="dept-select"
              sx={{ color: darkMode ? "#fff" : "#000" }}
            >
              {getText("Filter by Department", "تصفية حسب القسم")}
            </InputLabel>
            <Select
              labelId="dept-select"
              value={selectedDepartmentId}
              label={getText("Filter by Department", "تصفية حسب القسم")}
              onChange={(e) => {
                setSelectedDepartmentId(e.target.value === "all" ? "all" : e.target.value);
                setCurrentPage(1);
              }}
              disabled={departmentsLoading}
              sx={{
                color: darkMode ? "#fff" : "#000",
                ".MuiOutlinedInput-notchedOutline": {
                  borderColor: darkMode ? "#555" : "#ccc",
                },
              }}
            >
              <MenuItem value="all">{getText("All Departments", "كل الأقسام")}</MenuItem>
              {departmentsLoading ? (
                <MenuItem disabled>{getText("Loading departments...", "جاري تحميل الأقسام...")}</MenuItem>
              ) : (
                departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {getText(d.name, d.nameAr)}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Designation Table */}
      <Card sx={{ backgroundColor: darkMode ? "#222" : "#fff" }}>
        <CardContent>
          <Typography
            variant="body2"
            sx={{ mb: 2, color: darkMode ? "#ccc" : "text.secondary" }}
          >
            {filteredDesignations.length}{" "}
            {getText("designation(s)", "مسمى وظيفي")}
          </Typography>

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ backgroundColor: darkMode ? "#333" : "#fff" }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: darkMode ? "#fff" : "#000",
                      ...(isRTL
                        ? { textAlign: "right" }
                        : { textAlign: "left" }),
                    }}
                  >
                    {getText("Designation Title", "المسمى الوظيفي")}
                  </TableCell>
                  {selectedDepartmentId === "all" && (
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: darkMode ? "#fff" : "#000",
                        ...(isRTL ? { textAlign: "right" } : { textAlign: "left" }),
                      }}
                    >
                      {getText("Department", "القسم")}
                    </TableCell>
                  )}
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      minWidth: 120,
                      color: darkMode ? "#fff" : "#000",
                    }}
                  >
                    {getText("Actions", "الإجراءات")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                                {loading ? (
                  <TableRow>
                    <TableCell colSpan={selectedDepartmentId === "all" ? 3 : 2} align="center" sx={{ color: darkMode ? "#ccc" : "text.secondary" }}>
                      {getText("Loading designations...", "جاري تحميل المسميات الوظيفية...")}
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={selectedDepartmentId === "all" ? 3 : 2} align="center" sx={{ color: darkMode ? "#ccc" : "text.secondary" }}>
                      {selectedDepartmentId === "all" 
                        ? getText("No designations found", "لا توجد مسميات وظيفية")
                        : getText("No designations found for this department", "لا توجد مسميات وظيفية لهذا القسم")
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((designation) => {
                    // Find department name for this designation
                    const department = departments.find(d => d.id === designation.departmentId);
                    const departmentName = department ? getText(department.name, department.nameAr) : "Unknown Department";
                    
                    return (
                      <TableRow key={designation.id} hover>
                        <TableCell
                          sx={{
                            color: darkMode ? "#fff" : "#000",
                            ...(isRTL ? { textAlign: "right" } : { textAlign: "left" }),
                          }}
                        >
                          {getText(designation.title, designation.titleAr)}
                        </TableCell>
                        {selectedDepartmentId === "all" && (
                          <TableCell
                            sx={{
                              color: darkMode ? "#fff" : "#000",
                              ...(isRTL ? { textAlign: "right" } : { textAlign: "left" }),
                            }}
                          >
                            {departmentName}
                          </TableCell>
                        )}
                        <TableCell align="center">
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => {
                                setEditingDesignation(designation);
                                setModalOpen(true);
                              }}
                              title={getText("Edit", "تعديل")}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => {
                                setDesignationToDelete(designation);
                                setDeleteDialogOpen(true);
                              }}
                              title={getText("Delete", "حذف")}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 3,
                backgroundColor: darkMode ? "#222" : "transparent",
                p: 1,
                borderRadius: "8px",
              }}
            >
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color={darkMode ? "standard" : "primary"}
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: darkMode ? "#fff" : "inherit",
                    borderColor: darkMode ? "#555" : "inherit",
                  },
                  "& .Mui-selected": {
                    backgroundColor: darkMode ? "#444" : "primary.main",
                    color: darkMode ? "#000" : "#fff",
                  },
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <DesignationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveDesignation}
        designation={editingDesignation}
        isRTL={isRTL}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteDesignation}
        designationTitle={
          designationToDelete
            ? getText(designationToDelete.title, designationToDelete.titleAr)
            : ""
        }
        isRTL={isRTL}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
