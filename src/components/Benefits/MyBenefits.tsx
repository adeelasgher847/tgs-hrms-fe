import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
} from '@mui/material';
import { useLanguage } from '../../hooks/useLanguage';
import { Download } from '@mui/icons-material';
import { listBenefits, listEmployeeBenefits } from '../../api/benefits';
import type { Benefit, EmployeeBenefitAssignment } from '../../types/benefits';
import jsPDF from 'jspdf';

interface MyBenefitsProps {
  employeeId: string;
}

export default function MyBenefits({ employeeId }: MyBenefitsProps) {
  const [assignments, setAssignments] = useState<EmployeeBenefitAssignment[]>(
    []
  );
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      listEmployeeBenefits(employeeId),
      listBenefits({ page: 1, pageSize: 100 }),
    ])
      .then(([assignmentsRes, benefitsRes]) => {
        setAssignments(assignmentsRes);
        setBenefits(benefitsRes.items);
      })
      .finally(() => setLoading(false));
  }, [employeeId]);

  const { language } = useLanguage();

  const statusMap = useMemo(
    () => ({ active: 'Active', ended: 'Ended', scheduled: 'Scheduled' }),
    []
  );

  const getBenefitDetails = (benefitId: string) => {
    return benefits.find(b => b.id === benefitId);
  };

  const handleDownloadPDF = () => {
    if (assignments.length === 0) {
      alert('No benefits to download');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Benefits Summary', pageWidth / 2, yPosition, {
      align: 'center',
    });
    yPosition += 15;

    // Employee Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Employee ID: ${employeeId}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 20;

    // Benefits Table Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Assigned Benefits', 20, yPosition);
    yPosition += 15;

    // Table Headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const headers = [
      'Benefit Name',
      'Type',
      'Start Date',
      'End Date',
      'Status',
    ];
    const colWidths = [60, 25, 30, 30, 25];
    let xPosition = 20;

    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    yPosition += 10;

    // Table Data
    doc.setFont('helvetica', 'normal');
    assignments.forEach(assignment => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      const benefit = getBenefitDetails(assignment.benefitId);
      const rowData = [
        benefit?.name || assignment.benefitId,
        benefit?.type || '-',
        assignment.startDate,
        assignment.endDate || '-',
        assignment.status,
      ];

      xPosition = 20;
      rowData.forEach((data, index) => {
        // Truncate long text
        const text = data.length > 15 ? data.substring(0, 15) + '...' : data;
        doc.text(text, xPosition, yPosition);
        xPosition += colWidths[index];
      });
      yPosition += 8;
    });

    // Summary
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Benefits: ${assignments.length}`, 20, yPosition);
    yPosition += 8;

    const activeCount = assignments.filter(a => a.status === 'active').length;
    doc.text(`Active Benefits: ${activeCount}`, 20, yPosition);

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'This document was generated automatically by HRMS',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Download
    doc.save(
      `benefits-summary-${employeeId}-${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction={language === 'ar' ? 'row-reverse' : 'row'}
        justifyContent='space-between'
        alignItems='center'
      >
        <Typography
          variant='h6'
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}
        >
          My Benefits
        </Typography>
        <Box dir='ltr'>
          <Button
            variant='outlined'
            startIcon={<Download />}
            onClick={handleDownloadPDF}
            size='small'
          >
            Benefit Summary
          </Button>
        </Box>
      </Stack>
      <Card>
        <CardContent>
          {loading ? (
            <Stack alignItems='center' py={4}>
              <CircularProgress />
            </Stack>
          ) : (
            <>
              <Box sx={{ overflowX: 'auto', width: '100%' }} dir='ltr'>
                <Table size='small' sx={{ minWidth: 600 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Benefit Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignments.map(a => {
                      const benefit = getBenefitDetails(a.benefitId);
                      return (
                        <TableRow key={a.id} hover>
                          <TableCell>
                            <Stack>
                              <Typography
                                variant='body2'
                                fontWeight='medium'
                                dir='ltr'
                              >
                                {benefit?.name || a.benefitId}
                              </Typography>
                              {benefit?.description && (
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  {benefit.description}
                                </Typography>
                              )}
                              {benefit?.eligibility && (
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  Eligibility: {benefit.eligibility}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>{benefit?.type || '-'}</TableCell>
                          <TableCell>{a.startDate}</TableCell>
                          <TableCell>{a.endDate || '-'}</TableCell>
                          <TableCell>{statusMap[a.status]}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
              {assignments.length === 0 && (
                <Stack alignItems='center' py={4}>
                  <Typography color='text.secondary'>
                    No benefits assigned
                  </Typography>
                </Stack>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
