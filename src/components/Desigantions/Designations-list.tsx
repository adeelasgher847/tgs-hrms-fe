"use client"

import { Box, Typography, IconButton, Card, CardContent, Grid, useMediaQuery, useTheme, Alert } from "@mui/material"
import { Edit as EditIcon, Delete as DeleteIcon, Work as WorkIcon } from "@mui/icons-material"
import type { Designation } from "@/types/designation"

interface DesignationsListProps {
  designations: Designation[]
  onEdit: (designation: Designation) => void
  onDelete: (designation: Designation) => void
  getText: (en: string, ar: string) => string
  isRTL: boolean
}

export default function DesignationsList({ designations, onEdit, onDelete, getText, isRTL }: DesignationsListProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  if (designations.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        <Typography variant="body1">
          {getText(
            'No designations found for this department. Click "Add Designation" to create one.',
            'لم يتم العثور على مسميات وظيفية لهذا القسم. انقر على "إضافة مسمى وظيفي" لإنشاء واحد.',
          )}
        </Typography>
      </Alert>
    )
  }

  return (
    <Grid container spacing={2}>
      {designations.map((designation) => (
        <Grid item xs={12} sm={6} md={4} key={designation.id}>
          <Card
            sx={{
              height: "100%",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px 0 rgb(0 0 0 / 0.15)",
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "10px",
                      bgcolor: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <WorkIcon sx={{ fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="600"
                      sx={{
                        lineHeight: 1.3,
                        wordBreak: "break-word",
                      }}
                    >
                      {getText(designation.title, designation.titleAr)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 0.5, ml: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => onEdit(designation)}
                    sx={{
                      color: "primary.main",
                      "&:hover": { bgcolor: "primary.50" },
                    }}
                  >
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onDelete(designation)}
                    sx={{
                      color: "error.main",
                      "&:hover": { bgcolor: "error.50" },
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
