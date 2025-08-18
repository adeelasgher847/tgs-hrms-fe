import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TimesheetDayRow from "./TimesheetDayRow";
import { getCurrentUser } from "../../utils/auth";

type Entry = { day: string; date: string; hours: number; ranges: string[] };

type Props = {
  entries: Entry[];
  currentDayIndex: number | null;
  isClockedIn: boolean;
  startTime: number | null;
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
};

const formatRange = (start: Date) => {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const startPart = start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const endPart = end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return `${startPart}–${endPart}`;
};

const parseRange = (range: string) => {
  const [from, to] = range.split("-").map((s) => s.trim());
  return { from, to };
};

const SheetList: React.FC<Props> = ({
  entries,
  currentDayIndex,
  isClockedIn,
  startTime,
  weekStart,
  onPrevWeek,
  onNextWeek,
}) => {
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    if (isClockedIn && startTime) {
      timer = window.setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isClockedIn, startTime]);

  const user = getCurrentUser();

  const getDialogData = (entry: Entry, index: number) => {
    const isTodayLive = index === currentDayIndex && isClockedIn && startTime;
    let totalHrs = entry.hours;
    let startLabel = "--";
    let endLabel = "--";

    if (entry.ranges.length > 0) {
      const { from, to } = parseRange(entry.ranges[0]);
      startLabel = from.replace(/\s*-\s*$/, "");
      endLabel = to && to !== "" ? to : "—";
    }

    if (isTodayLive && startTime) {
      const startDate = new Date(startTime);
      startLabel = startDate
        .toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .toUpperCase();
      totalHrs = elapsedMs / 3600000;
      endLabel = "—";
    }

    return { startLabel, endLabel, totalHrs };
  };

  return (
    <Box p={3}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1,
              bgcolor: "#e8f5e9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "success.main",
            }}
          >
            📅
          </Box>
          <Typography fontWeight={700}>{formatRange(weekStart)}</Typography>
        </Box>

        <Box>
          <IconButton size="small" onClick={onPrevWeek}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onNextWeek}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Box display="flex" flexDirection="column" gap={1.5}>
        {entries.map((entry, index) => (
          <React.Fragment key={index}>
            <TimesheetDayRow
              {...entry}
              highlight={index === currentDayIndex}
              liveHours={
                index === currentDayIndex && isClockedIn
                  ? elapsedMs / 3600000
                  : null
              }
              onClick={() => setOpenIdx(index)}
            />
            {index < entries.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Box>

      <Dialog
        open={openIdx !== null}
        onClose={() => setOpenIdx(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Day details</DialogTitle>
        <DialogContent>
          {openIdx !== null && (
            <Box>
              {(() => {
                const { startLabel, endLabel, totalHrs } = getDialogData(
                  entries[openIdx],
                  openIdx
                );
                const totalMinutes = Math.max(0, Math.round(totalHrs * 60));
                const h = Math.floor(totalMinutes / 60);
                const m = totalMinutes % 60;
                const totalStr = `${h}h ${String(m).padStart(2, "0")}m`;
                return (
                  <Table size="small" sx={{ mt: 1 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          Work start
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Work end</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Total hours
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>{`${user?.first_name ?? "User"} ${
                          user?.last_name ?? ""
                        }`}</TableCell>
                        <TableCell>{startLabel}</TableCell>
                        <TableCell>{endLabel}</TableCell>
                        <TableCell align="right">{totalStr}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                );
              })()}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SheetList;
