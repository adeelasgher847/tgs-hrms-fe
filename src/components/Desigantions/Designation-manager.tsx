import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  ToggleButton,
  ToggleButtonGroup,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Language as LanguageIcon,
} from "@mui/icons-material";
import DesignationModal from "../Desigantions/Designation-modal";
import DeleteConfirmationDialog from "./Delete-confirmation-dialog";
import { mockDepartments, mockDesignations } from "../../Data/mockData";
import type { Department, Designation } from "../../Data/mockData";

interface Props {
  direction: "ltr" | "rtl";
  onDirectionChange: (dir: "ltr" | "rtl") => void;
}

export default function DesignationManager({
  direction,
  onDirectionChange,
}: Props) {
  const isRTL = direction === "rtl";

  const [departments] = useState<Department[]>(mockDepartments);
  const [designations, setDesignations] =
    useState<Designation[]>(mockDesignations);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] =
    useState<Designation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [designationToDelete, setDesignationToDelete] =
    useState<Designation | null>(null);

  const getText = (en: string, ar: string) => (isRTL ? ar : en);

  const filteredDesignations =
    selectedDepartmentId !== null
      ? designations.filter((d) => d.departmentId === selectedDepartmentId)
      : [];

  const selectedDepartment = departments.find(
    (d) => d.id === selectedDepartmentId
  );

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
        departmentId: selectedDepartmentId as number,
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
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
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {getText("Designations", "المسميات الوظيفية")}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <ToggleButtonGroup
            size="small"
            value={direction}
            exclusive
            onChange={(_, newDir) => {
              if (newDir !== null) {
                onDirectionChange(newDir);
              }
            }}
            sx={{ height: 36 }}
          >
            <ToggleButton value="ltr">
              <LanguageIcon fontSize="small" sx={{ mr: 0.5 }} /> EN
            </ToggleButton>
            <ToggleButton value="rtl">
              <LanguageIcon fontSize="small" sx={{ mr: 0.5 }} /> عربي
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={selectedDepartmentId === null}
            onClick={() => {
              setEditingDesignation(null);
              setModalOpen(true);
            }}
            sx={{ minWidth: 200, fontWeight: 600, py: 1 }}
          >
            {getText("Create Designation", "إنشاء مسمى وظيفي")}
          </Button>
        </Box>
      </Box>

      {/* Department Select */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl fullWidth>
            <InputLabel id="department-select-label">
              {getText("Select Department", "اختر القسم")}
            </InputLabel>
            <Select
              labelId="department-select-label"
              value={selectedDepartmentId !== null ? selectedDepartmentId : ""}
              label={getText("Select Department", "اختر القسم")}
              onChange={(e) =>
                setSelectedDepartmentId(
                  String(e.target.value) === "" ? null : Number(e.target.value)
                )
              }
              sx={{ minHeight: 56 }}
            >
              <MenuItem value="">
                <em>
                  {getText("-- Select Department --", "-- اختر القسم --")}
                </em>
              </MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {getText(dept.name, dept.nameAr)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Designation Table */}
      {selectedDepartmentId === null ? (
        <Alert severity="info" sx={{ fontSize: "1rem" }}>
          {getText(
            "Please select a department to view and manage its designations.",
            "يرجى اختيار قسم لعرض وإدارة مسمياته الوظيفية."
          )}
        </Alert>
      ) : (
        <Card>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {getText("Designations in", "المسميات الوظيفية في")}{" "}
                <strong>
                  {selectedDepartment
                    ? getText(
                        selectedDepartment.name,
                        selectedDepartment.nameAr
                      )
                    : ""}
                </strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredDesignations.length}{" "}
                {getText("designation(s) found", "مسمى وظيفي")}
              </Typography>
            </Box>

            {filteredDesignations.length === 0 ? (
              <Alert severity="warning">
                {getText(
                  'No designations found for this department. Click "Create Designation" to add one.',
                  'لا توجد مسميات وظيفية لهذا القسم. انقر "إنشاء مسمى وظيفي" لإضافة واحد.'
                )}
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        {getText("Designation Title", "المسمى الوظيفي")}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: "bold", minWidth: 120 }}
                      >
                        {getText("Actions", "الإجراءات")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDesignations.map((designation) => (
                      <TableRow key={designation.id} hover>
                        <TableCell>
                          <Typography variant="body1">
                            {getText(designation.title, designation.titleAr)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              justifyContent: "center",
                            }}
                          >
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
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <DesignationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveDesignation}
        designation={editingDesignation}
        isRTL={isRTL}
        getText={getText}
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
        getText={getText}
      />
    </Container>
  );
}
