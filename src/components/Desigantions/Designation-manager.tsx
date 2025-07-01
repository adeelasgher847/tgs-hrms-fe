"\"use client"

import { useState } from "react"
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
  useMediaQuery,
  useTheme,
  Stack,
} from "@mui/material"
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Language as LanguageIcon,
  Business as BusinessIcon,
} from "@mui/icons-material"
import DesignationModal from "./designation-modal"
import DeleteConfirmationDialog from "./delete-confirmation-dialog"
import { mockDepartments, mockDesignations } from "@/data/mockData"
import type { Department, Designation, DesignationManagerProps, DesignationFormData, GetTextFunction } from "@/types"

export type { Department, Designation }

export default function DesignationManager({ direction, onDirectionChange }: DesignationManagerProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const isRTL = direction === "rtl"

  const [departments] = useState<Department[]>(mockDepartments)
  const [designations, setDesignations] = useState<Designation[]>(mockDesignations)

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | "">("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [designationToDelete, setDesignationToDelete] = useState<Designation | null>(null)

  // Helper function for text direction
  const getText: GetTextFunction = (en: string, ar: string) => (isRTL ? ar : en)

  // Filter designations by selected department
  const filteredDesignations =
    selectedDepartmentId !== "" ? designations.filter((d) => d.departmentId === selectedDepartmentId) : []

  const selectedDepartment = departments.find((d) => d.id === selectedDepartmentId)

  // Debug logs
  console.log("Selected Department ID:", selectedDepartmentId)
  console.log("Filtered Designations:", filteredDesignations)
  console.log("All Designations:", designations.length)

  // Handle save designation (create or update)
  const handleSaveDesignation = (data: DesignationFormData) => {
    if (editingDesignation) {
      // Update existing designation
      setDesignations((prev) => prev.map((d) => (d.id === editingDesignation.id ? { ...d, ...data } : d)))
    } else {
      // Create new designation
      const newDesignation: Designation = {
        id: Math.max(...designations.map((d) => d.id), 0) + 1,
        title: data.title,
        titleAr: data.titleAr,
        departmentId: selectedDepartmentId as number,
      }
      setDesignations((prev) => [...prev, newDesignation])
    }
    setModalOpen(false)
    setEditingDesignation(null)
  }

  // Handle delete designation
  const handleDeleteDesignation = () => {
    if (designationToDelete) {
      setDesignations((prev) => prev.filter((d) => d.id !== designationToDelete.id))
    }
    setDeleteDialogOpen(false)
    setDesignationToDelete(null)
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Language Toggle */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <BusinessIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight="bold">
            {getText("Designation Management", "إدارة المسميات الوظيفية")}
          </Typography>
        </Box>

        <ToggleButtonGroup
          size="small"
          value={direction}
          exclusive
          onChange={(_, dir) => dir && onDirectionChange(dir)}
        >
          <ToggleButton value="ltr">
            <LanguageIcon fontSize="small" sx={{ mr: 0.5 }} />
            EN
          </ToggleButton>
          <ToggleButton value="rtl">
            <LanguageIcon fontSize="small" sx={{ mr: 0.5 }} />
            العربية
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Department Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={3}>
            {/* Department Dropdown */}
            <FormControl fullWidth>
              <InputLabel id="department-select-label">{getText("Select Department", "اختر القسم")}</InputLabel>
              <Select
                labelId="department-select-label"
                value={selectedDepartmentId}
                label={getText("Select Department", "اختر القسم")}
                onChange={(e) => {
                  const value = e.target.value
                  console.log("Department selected:", value) // Debug log
                  setSelectedDepartmentId(value === "" ? "" : Number(value))
                }}
                sx={{ minHeight: 56 }}
              >
                <MenuItem value="">
                  <em>{getText("-- Select Department --", "-- اختر القسم --")}</em>
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {getText(dept.name, dept.nameAr)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Create Designation Button - Only enabled when department is selected */}
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              disabled={selectedDepartmentId === ""}
              onClick={() => {
                setEditingDesignation(null)
                setModalOpen(true)
              }}
              fullWidth={isMobile}
              sx={{
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 600,
                alignSelf: isMobile ? "stretch" : "flex-start",
                minWidth: isMobile ? "auto" : 200,
              }}
            >
              {getText("Create Designation", "إنشاء مسمى وظيفي")}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Designations List */}
      {selectedDepartmentId === "" ? (
        <Alert severity="info" sx={{ fontSize: "1rem" }}>
          {getText(
            "Please select a department to view and manage its designations.",
            "يرجى اختيار قسم لعرض وإدارة مسمياته الوظيفية.",
          )}
        </Alert>
      ) : (
        <Card>
          <CardContent>
            {/* Department Info Header */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {getText("Designations in", "المسميات الوظيفية في")}{" "}
                <strong>{selectedDepartment ? getText(selectedDepartment.name, selectedDepartment.nameAr) : ""}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredDesignations.length} {getText("designation(s) found", "مسمى وظيفي")}
              </Typography>
            </Box>

            {/* Designations Table/List */}
            {filteredDesignations.length === 0 ? (
              <Alert severity="warning">
                {getText(
                  'No designations found for this department. Click "Create Designation" to add one.',
                  'لا توجد مسميات وظيفية لهذا القسم. انقر "إنشاء مسمى وظيفي" لإضافة واحد.',
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
                      <TableCell align="center" sx={{ fontWeight: "bold", minWidth: 120 }}>
                        {getText("Actions", "الإجراءات")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDesignations.map((designation) => (
                      <TableRow key={designation.id} hover>
                        <TableCell>
                          <Typography variant="body1">{getText(designation.title, designation.titleAr)}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                            {/* Edit Button */}
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => {
                                setEditingDesignation(designation)
                                setModalOpen(true)
                              }}
                              title={getText("Edit", "تعديل")}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            {/* Delete Button */}
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => {
                                setDesignationToDelete(designation)
                                setDeleteDialogOpen(true)
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

      {/* Create/Edit Designation Modal */}
      <DesignationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveDesignation}
        designation={editingDesignation}
        isRTL={isRTL}
        getText={getText}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteDesignation}
        designationTitle={designationToDelete ? getText(designationToDelete.title, designationToDelete.titleAr) : ""}
        isRTL={isRTL}
        getText={getText}
      />
    </Container>
  )
}
