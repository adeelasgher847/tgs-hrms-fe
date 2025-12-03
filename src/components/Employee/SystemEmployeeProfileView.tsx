import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Button,
  Stack,
  Divider,
  DialogActions,
} from '@mui/material';
import {
  Work,
  Business,
  Email,
  Star,
  Close,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import systemEmployeeApiService, {
  type Benefit,
  type EmployeeLeave,
  type EmployeeAsset,
  type EmployeePerformance,
  type SystemEmployeeDetails,
} from '../../api/systemEmployeeApi';
import UserAvatar from '../common/UserAvatar';
import { useLanguage } from '../../hooks/useLanguage';
import KpiDetailCard from '../KPI/KPICardDetail';

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId: string | null;
}

const SystemEmployeeProfileView: React.FC<Props> = ({
  open,
  onClose,
  employeeId,
}) => {
  const { language } = useLanguage();

  const STRINGS = {
    en: {
      title: 'Employee Profile',
      noProfile: 'No profile data available',
      leaves: 'Leaves',
      type: 'Type',
      from: 'From',
      to: 'To',
      reason: 'Reason',
      status: 'Status',
      noLeaves: 'No leaves found',
      assignedAssets: 'Assigned Assets',
      assetName: 'Asset Name',
      category: 'Category',
      noAssets: 'No assets assigned',
      assignedBenefits: 'Assigned Benefits',
      benefitType: 'Type:',
      benefitStatus: 'Status:',
      eligibility: 'Eligibility:',
      duration: 'Duration:',
      assignedOn: 'Assigned on',
      benefitDetailsTitle: 'Benefit Details',
      noBenefitSelected: 'No benefit selected.',
      close: 'Close',
      kpisOverview: 'KPIs Overview',
      noKpis: 'No KPI data available',
      promotions: 'Promotions',
      previousDesignation: 'Previous Designation',
      newDesignation: 'New Designation',
      effectiveDate: 'Effective Date',
      remarks: 'Remarks',
      noPromotions: 'No promotion records',
      performanceReviews: 'Performance Reviews',
      cycle: 'Cycle',
      overallScore: 'Overall Score',
      recommendation: 'Recommendation',
      noPerformanceReviews: 'No performance reviews',
      targetLabel: 'Target:',
      achievedLabel: 'Achieved:',
    },
    ar: {
      title: 'ملف الموظف',
      noProfile: 'لا توجد بيانات للملف',
      leaves: 'الإجازات',
      type: 'النوع',
      from: 'من',
      to: 'إلى',
      reason: 'السبب',
      status: 'الحالة',
      noLeaves: 'لا توجد إجازات',
      assignedAssets: 'الموجودات المُخصصة',
      assetName: 'اسم الأصل',
      category: 'الفئة',
      noAssets: 'لا توجد موجودات مُخصصة',
      assignedBenefits: 'المزايا المخصصة',
      benefitType: 'النوع:',
      benefitStatus: 'الحالة:',
      eligibility: 'الأهلية:',
      duration: 'المدة:',
      assignedOn: 'تاريخ التعيين',
      benefitDetailsTitle: 'تفاصيل الميزة',
      noBenefitSelected: 'لم يتم تحديد ميزة.',
      close: 'إغلاق',
      kpisOverview: 'نظرة عامة على مؤشرات الأداء',
      noKpis: 'لا توجد بيانات لمؤشرات الأداء',
      promotions: 'الترقيات',
      previousDesignation: 'المسمى السابق',
      newDesignation: 'المسمى الجديد',
      effectiveDate: 'تاريخ السريان',
      remarks: 'ملاحظات',
      noPromotions: 'لا توجد سجلات ترقيات',
      performanceReviews: 'مراجعات الأداء',
      cycle: 'الدورة',
      overallScore: 'المجموع الكلي',
      recommendation: 'التوصية',
      noPerformanceReviews: 'لا توجد مراجعات للأداء',
      targetLabel: 'الهدف:',
      achievedLabel: 'المنجز:',
    },
  } as const;

  const L = useMemo(
    () => STRINGS[language as keyof typeof STRINGS] || STRINGS.en,
    [language]
  );
  const [profile, setProfile] = useState<SystemEmployeeDetails | null>(null);
  const [leaves, setLeaves] = useState<EmployeeLeave[]>([]);
  const [assets, setAssets] = useState<EmployeeAsset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKpi, setSelectedKpi] = useState<EmployeePerformance | null>(
    null
  );
  const [openKpiDialog, setOpenKpiDialog] = useState(false);
  const [openBenefitDialog, setOpenBenefitDialog] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);

  useEffect(() => {
    if (!employeeId || !open) return;

    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const profileRes =
          await systemEmployeeApiService.getSystemEmployeeById(employeeId);
        setProfile(profileRes);

        // Note: All system employee API endpoints (leaves, assets, performance) use employee ID, not user ID
        const [leavesRes, assetsRes, performanceRes] = await Promise.all([
          systemEmployeeApiService.getSystemEmployeeLeaves(employeeId),
          systemEmployeeApiService.getSystemEmployeeAssets(employeeId),
          systemEmployeeApiService.getSystemEmployeePerformance(employeeId),
        ]);

        setLeaves(leavesRes);
        setAssets(assetsRes);

        setProfile(prev => (prev ? { ...prev, kpis: performanceRes } : null));
      } catch (e: unknown) {
        setError((e as Error)?.message || 'Failed to load employee data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [employeeId, open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='md'
      scroll='paper'
      PaperProps={{
        sx: { borderRadius: 1, maxHeight: '90vh', overflowY: 'auto' },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pr: 2,
          flexDirection: language === 'ar' ? 'row-reverse' : 'row',
        }}
      >
        <Typography
          component='span'
          sx={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'primary.main',
            direction: 'ltr',
            flex: 1,
            textAlign: language === 'ar' ? 'right' : 'left',
          }}
        >
          {L.title}
        </Typography>
        <IconButton
          onClick={onClose}
          size='small'
          aria-label='close'
          sx={language === 'ar' ? { ml: 0, mr: 1 } : { ml: 1, mr: 0 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading ? (
          <Box py={3} display='flex' justifyContent='center'>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box py={3}>
            <Alert severity='error'>{error}</Alert>
          </Box>
        ) : !profile ? (
          <Typography variant='body2' align='center' color='text.secondary'>
            {L.noProfile}
          </Typography>
        ) : (
          <Box py={2} display='flex' flexDirection='column' gap={2}>
            <Paper
              elevation={1}
              sx={{ borderRadius: 3, p: 2, boxShadow: 'none' }}
            >
              <Box display='flex' alignItems='center'>
                <UserAvatar
                  user={{
                    id: profile.id,
                    first_name: profile.name.split(' ')[0] || '',
                    last_name: profile.name.split(' ').slice(1).join(' ') || '',
                    profile_pic: '',
                  }}
                  size={80}
                  sx={{ mr: 2 }}
                />
                <Box>
                  <Typography variant='h6' fontWeight={600}>
                    {profile.name}
                  </Typography>
                  <Chip
                    label={profile.designationTitle || '—'}
                    icon={<Work />}
                    sx={{ mr: 1, mb: 1 }}
                    color='secondary'
                  />
                  <Chip
                    label={profile.departmentName || '—'}
                    icon={<Business />}
                    sx={{ mb: 1 }}
                    color='info'
                  />
                  <Typography variant='body2' color='text.secondary' mt={1}>
                    <Email sx={{ fontSize: 16, mr: 0.5 }} />{' '}
                    {profile.email || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Paper
              elevation={1}
              sx={{ borderRadius: 3, p: 2, boxShadow: 'none' }}
            >
              <Typography
                variant='h6'
                fontWeight={600}
                gutterBottom
                color='primary.main'
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                textAlign={language === 'ar' ? 'right' : 'left'}
              >
                {L.leaves}
              </Typography>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'rgba(33,150,243,0.08)' }}>
                      <TableCell>{L.type}</TableCell>
                      <TableCell>{L.from}</TableCell>
                      <TableCell>{L.to}</TableCell>
                      <TableCell>{L.reason}</TableCell>
                      <TableCell>{L.status}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaves.length ? (
                      leaves.map((leave, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{leave.leaveTypeId || '—'}</TableCell>
                          <TableCell>
                            {new Date(leave.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(leave.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{leave.reason || '—'}</TableCell>
                          <TableCell>
                            <Chip
                              label={leave.status}
                              size='small'
                              sx={{
                                bgcolor:
                                  leave.status.toLowerCase() === 'approved'
                                    ? 'success.main'
                                    : leave.status.toLowerCase() === 'pending'
                                      ? 'warning.main'
                                      : 'error.main',
                                color: '#fff',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align='center'>
                          {L.noLeaves}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper
              elevation={1}
              sx={{ borderRadius: 3, p: 2, boxShadow: 'none' }}
            >
              <Typography
                variant='h6'
                fontWeight={600}
                gutterBottom
                color='primary.main'
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                textAlign={language === 'ar' ? 'right' : 'left'}
              >
                {L.assignedAssets}
              </Typography>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'rgba(255,152,0,0.08)' }}>
                      <TableCell>{L.assetName}</TableCell>
                      <TableCell>{L.category}</TableCell>
                      <TableCell>{L.status}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assets.length ? (
                      assets.map((asset, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{asset.name}</TableCell>
                          <TableCell>{asset.category}</TableCell>
                          <TableCell>
                            <Chip
                              label={asset.status}
                              size='small'
                              sx={{
                                bgcolor:
                                  asset.status.toLowerCase() === 'assigned'
                                    ? 'success.main'
                                    : 'error.main',
                                color: '#fff',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align='center'>
                          {L.noAssets}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper
              elevation={1}
              sx={{ borderRadius: 3, p: 2, boxShadow: 'none' }}
            >
              <Typography
                variant='h6'
                fontWeight={600}
                gutterBottom
                color='primary.main'
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                textAlign={language === 'ar' ? 'right' : 'left'}
              >
                {L.assignedBenefits}
              </Typography>

              {profile.benefits?.length ? (
                <Box
                  display='grid'
                  gridTemplateColumns={{
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: '1fr 1fr 1fr',
                  }}
                  gap={2}
                >
                  {profile.benefits.map((b, idx) => (
                    <Paper
                      key={idx}
                      elevation={3}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant='h6' fontWeight={600}>
                        {b.benefit.name}
                      </Typography>

                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant='subtitle2' color='text.secondary'>
                          {L.benefitType}
                        </Typography>
                        <Chip
                          label={b.benefit.type}
                          color='primary'
                          size='small'
                          variant='outlined'
                        />
                      </Box>

                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant='subtitle2' color='text.secondary'>
                          {L.benefitStatus}
                        </Typography>
                        <Chip
                          label={b.status}
                          color={
                            b.status.toLowerCase() === 'active'
                              ? 'success'
                              : b.status.toLowerCase() === 'pending'
                                ? 'warning'
                                : 'default'
                          }
                          size='small'
                        />
                      </Box>

                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant='subtitle2' color='text.secondary'>
                          {L.eligibility}
                        </Typography>
                        <Typography variant='body2'>
                          {b.benefit.eligibilityCriteria}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant='subtitle2' color='text.secondary'>
                          {L.duration}
                        </Typography>
                        <Typography variant='body2'>
                          {new Date(b.startDate).toLocaleDateString()} -{' '}
                          {new Date(b.endDate).toLocaleDateString()}
                        </Typography>
                      </Box>

                      <Box
                        mt={1.5}
                        display='flex'
                        alignItems='center'
                        justifyContent='space-between'
                      >
                        <Typography variant='caption' color='text.secondary'>
                          {L.assignedOn}{' '}
                          {new Date(b.createdAt).toLocaleDateString()}
                        </Typography>

                        <Button
                          variant='text'
                          size='small'
                          color='primary'
                          onClick={() => {
                            setSelectedBenefit(b);
                            setOpenBenefitDialog(true);
                          }}
                        >
                          <VisibilityIcon />
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  align='center'
                  mt={1}
                >
                  No benefits assigned
                </Typography>
              )}

              <Dialog
                open={openBenefitDialog}
                onClose={() => setOpenBenefitDialog(false)}
                maxWidth='sm'
                fullWidth
              >
                <DialogTitle>{L.benefitDetailsTitle}</DialogTitle>
                <DialogContent dividers>
                  {selectedBenefit ? (
                    <>
                      <Typography variant='h6' fontWeight={600} gutterBottom>
                        {selectedBenefit.benefit.name}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Type: {selectedBenefit.benefit.type}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Eligibility:{' '}
                        {selectedBenefit.benefit.eligibilityCriteria}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Status: {selectedBenefit.status}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Start Date:{' '}
                        {new Date(
                          selectedBenefit.startDate
                        ).toLocaleDateString()}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        End Date:{' '}
                        {new Date(selectedBenefit.endDate).toLocaleDateString()}
                      </Typography>

                      <Divider sx={{ my: 1.5 }} />

                      <Typography variant='subtitle2' color='text.secondary'>
                        Description:
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{ whiteSpace: 'pre-line' }}
                      >
                        {selectedBenefit.benefit.description}
                      </Typography>
                    </>
                  ) : (
                    <Typography>{L.noBenefitSelected}</Typography>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenBenefitDialog(false)}>
                    {L.close}
                  </Button>
                </DialogActions>
              </Dialog>
            </Paper>

            <Paper
              elevation={1}
              sx={{ borderRadius: 3, p: 2, boxShadow: 'none' }}
            >
              <Typography
                variant='h6'
                fontWeight={600}
                gutterBottom
                color='primary.main'
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                textAlign={language === 'ar' ? 'right' : 'left'}
              >
                {L.kpisOverview}
              </Typography>

              {profile.kpis?.length ? (
                <Box
                  display='grid'
                  gridTemplateColumns={{
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: '1fr 1fr 1fr',
                  }}
                  gap={2}
                >
                  {(profile.kpis as EmployeePerformance[]).map((kpi, idx) => {
                    const achievedPercent =
                      kpi.targetValue && kpi.achievedValue
                        ? Math.min(
                            (kpi.achievedValue / kpi.targetValue) * 100,
                            100
                          )
                        : 0;

                    const stars = Math.round(kpi.score || 0);
                    const filledStars = Array(stars).fill('★').join('');
                    const emptyStars = Array(5 - stars)
                      .fill('☆')
                      .join('');

                    return (
                      <Paper
                        key={idx}
                        variant='outlined'
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          borderColor: 'orange.200',
                        }}
                      >
                        <Typography
                          variant='subtitle1'
                          fontWeight={600}
                          color='text.primary'
                          gutterBottom
                        >
                          {kpi.kpi?.title || 'Untitled KPI'}
                        </Typography>

                        <Typography
                          variant='body2'
                          color='text.secondary'
                          mb={0.5}
                        >
                          {L.targetLabel} {kpi.targetValue ?? '—'} |{' '}
                          {L.achievedLabel} {kpi.achievedValue ?? '—'}
                        </Typography>

                        <Box
                          sx={{
                            height: 8,
                            borderRadius: 5,
                            backgroundColor: 'grey.300',
                            overflow: 'hidden',
                            mb: 1,
                          }}
                        >
                          <Box
                            sx={{
                              width: `${achievedPercent}%`,
                              height: '100%',
                              backgroundColor:
                                achievedPercent >= 90
                                  ? 'success.main'
                                  : achievedPercent >= 60
                                    ? 'warning.main'
                                    : 'error.main',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </Box>

                        <Stack
                          direction='row'
                          spacing={1}
                          flexWrap='wrap'
                          useFlexGap
                          mb={1}
                        >
                          <Chip
                            label={kpi.reviewCycle || 'No Cycle'}
                            color='primary'
                            size='small'
                            variant='outlined'
                          />
                          <Chip
                            label={kpi.kpi?.category || 'No Category'}
                            color='secondary'
                            size='small'
                            variant='outlined'
                          />
                          <Chip
                            label={kpi.kpi?.status || 'Unknown'}
                            color={
                              kpi.kpi?.status === 'active'
                                ? 'success'
                                : kpi.kpi?.status === 'inactive'
                                  ? 'default'
                                  : 'warning'
                            }
                            size='small'
                            variant='outlined'
                          />
                        </Stack>

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            Score:
                            <span
                              style={{ color: '#FFB400', fontSize: '1.2rem' }}
                            >
                              {filledStars}
                            </span>
                            <span style={{ color: '#ccc', fontSize: '1.2rem' }}>
                              {emptyStars}
                            </span>
                          </Typography>

                          <Box
                            mt={1}
                            display='flex'
                            alignItems='center'
                            justifyContent='space-between'
                          >
                            <Button
                              variant='text'
                              size='small'
                              color='primary'
                              onClick={() => {
                                setSelectedKpi(kpi);
                                setOpenKpiDialog(true);
                              }}
                            >
                              <VisibilityIcon />
                            </Button>
                          </Box>
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              ) : (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  align='center'
                  mt={1}
                >
                  {L.noKpis}
                </Typography>
              )}

              <KpiDetailCard
                open={openKpiDialog}
                onClose={() => setOpenKpiDialog(false)}
                kpiData={selectedKpi}
              />
            </Paper>

            <Paper
              elevation={1}
              sx={{ borderRadius: 3, p: 2, boxShadow: 'none' }}
            >
              <Typography
                variant='h6'
                fontWeight={600}
                gutterBottom
                color='primary.main'
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                textAlign={language === 'ar' ? 'right' : 'left'}
              >
                {L.promotions}
              </Typography>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'rgba(156,39,176,0.08)' }}>
                      <TableCell>{L.previousDesignation}</TableCell>
                      <TableCell>{L.newDesignation}</TableCell>
                      <TableCell>{L.effectiveDate}</TableCell>
                      <TableCell>{L.status}</TableCell>
                      <TableCell>{L.remarks}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {profile.promotions?.length ? (
                      profile.promotions.map((p, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{p.previousDesignation}</TableCell>
                          <TableCell>{p.newDesignation}</TableCell>
                          <TableCell>
                            {new Date(p.effectiveDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={p.status}
                              size='small'
                              sx={{
                                bgcolor:
                                  p.status.toLowerCase() === 'approved'
                                    ? 'success.main'
                                    : 'warning.main',
                                color: '#fff',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell>{p.remarks || '—'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align='center'>
                          {L.noPromotions}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper
              elevation={1}
              sx={{ borderRadius: 3, p: 2, boxShadow: 'none' }}
            >
              <Typography
                variant='h6'
                fontWeight={600}
                gutterBottom
                color='primary.main'
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                textAlign={language === 'ar' ? 'right' : 'left'}
              >
                {L.performanceReviews}
              </Typography>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'rgba(76,175,80,0.08)' }}>
                      <TableCell>{L.cycle}</TableCell>
                      <TableCell>{L.overallScore}</TableCell>
                      <TableCell>{L.status}</TableCell>
                      <TableCell>{L.recommendation}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {profile.performanceReviews?.length ? (
                      profile.performanceReviews.map((pr, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{pr.cycle}</TableCell>
                          <TableCell>
                            <Chip
                              label={`${pr.overallScore ?? '—'} ★`}
                              icon={<Star />}
                              color='warning'
                              size='small'
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={pr.status}
                              size='small'
                              sx={{
                                bgcolor:
                                  pr.status.toLowerCase() === 'completed'
                                    ? 'success.main'
                                    : 'warning.main',
                                color: '#fff',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell>{pr.recommendation || '—'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align='center'>
                          {L.noPerformanceReviews}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SystemEmployeeProfileView;
