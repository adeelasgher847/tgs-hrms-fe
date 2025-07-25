import { useState } from "react";
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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

import { useOutletContext } from "react-router-dom";
import DesignationModal from "../Desigantions/Designation-modal";
import DeleteConfirmationDialog from "./Delete-confirmation-dialog";
import { mockDepartments, mockDesignations } from "../../data/mockData";
import type { Department, Designation } from "../../data/mockData";
import { useLanguage } from "../../context/LanguageContext";

export default function DesignationManager() {
  const { language, setLanguage } = useLanguage();
  const isRTL = language === "ar";

  const { darkMode } = useOutletContext<{ darkMode: boolean }>();

  const [designations, setDesignations] =
    useState<Designation[]>(mockDesignations);
  const [departments] = useState<Department[]>(mockDepartments);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [designationToDelete, setDesignationToDelete] = useState<Designation | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | "all">("all");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const getText = (en: string, ar: string) => (language === "ar" ? ar : en);

  const handleSaveDesignation = (data: { title: string; titleAr: string }) => {
    if (editingDesignation) {
      setDesignations((prev) =>
        prev.map((d) =>
          d.id === editingDesignation.id ? { ...d, ...data } : d
        )
      );
    } else {
      const newDesignation: Designation = {
        id: Math.max(...designations.map((d) => d.id), 0) + 1,
        title: data.title,
        titleAr: data.titleAr,
        departmentId: selectedDepartmentId === "all" ? 0 : selectedDepartmentId,
      };
      setDesignations((prev) => [...prev, newDesignation]);
    }
    setModalOpen(false);
    setEditingDesignation(null);
  };

  const handleDeleteDesignation = () => {
    if (designationToDelete) {
      setDesignations((prev) =>
        prev.filter((d) => d.id !== designationToDelete.id)
      );
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
    <Container maxWidth="xl" sx={{ mt: 4 }} dir={isRTL ? "rtl" : "ltr"}>
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
            <InputLabel id="dept-select" sx={{ color: darkMode ? "#fff" : "#000" }}>
              {getText("Filter by Department", "تصفية حسب القسم")}
            </InputLabel>
            <Select
              labelId="dept-select"
              value={selectedDepartmentId}
              label={getText("Filter by Department", "تصفية حسب القسم")}
              onChange={(e) => {
                setSelectedDepartmentId(e.target.value === "all" ? "all" : Number(e.target.value));
                setCurrentPage(1);
              }}
              sx={{
                color: darkMode ? "#fff" : "#000",
                ".MuiOutlinedInput-notchedOutline": {
                  borderColor: darkMode ? "#555" : "#ccc",
                },
              }}
            >
              <MenuItem value="all">{getText("All Departments", "كل الأقسام")}</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {getText(d.name, d.nameAr)}
                </MenuItem>
              ))}
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
            {filteredDesignations.length} {getText("designation(s)", "مسمى وظيفي")}
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
                      ...(isRTL ? { textAlign: "right" } : { textAlign: "left" }),
                    }}
                  >
                    {getText("Designation Title", "المسمى الوظيفي")}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: "bold", minWidth: 120, color: darkMode ? "#fff" : "#000" }}
                  >
                    {getText("Actions", "الإجراءات")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((designation) => (
                  <TableRow key={designation.id} hover>
                    <TableCell
                      sx={{
                        color: darkMode ? "#fff" : "#000",
                        ...(isRTL ? { textAlign: "right" } : { textAlign: "left" }),
                      }}
                    >
                      {getText(designation.title, designation.titleAr)}
                    </TableCell>
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
                ))}
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
    </Container>
  );
}
