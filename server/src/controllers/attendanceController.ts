import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../db.js';

// Normalize between client-visible values and DB-stored values
const toDbStatus = (status: string): string => {
  if (status === 'Half-Day') return 'HalfDay';
  if (status === 'Not Marked') return 'NotMarked';
  return status;
};
const fromDbStatus = (status: string): string => {
  if (status === 'HalfDay') return 'Half-Day';
  if (status === 'NotMarked') return 'Not Marked';
  return status;
};

// @desc    Get all attendance records (Admin/HR/Manager)
// @route   GET /api/attendance
// @access  Private
export const getAllAttendance = asyncHandler(async (req: Request, res: Response) => {
  const records = await prisma.attendanceRecord.findMany({
    orderBy: { date: 'desc' },
  });
  res.json(records.map(r => ({ ...r, status: fromDbStatus(r.status) })));
});

// @desc    Get my attendance records
// @route   GET /api/attendance/my
// @access  Private
export const getMyAttendance = asyncHandler(async (req: any, res: Response) => {
  const records = await prisma.attendanceRecord.findMany({
    where: { employeeId: req.user.id },
    orderBy: { date: 'desc' },
  });
  res.json(records.map(r => ({ ...r, status: fromDbStatus(r.status) })));
});

// @desc    Get my attendance for today
// @route   GET /api/attendance/today
// @access  Private
export const getMyTodayAttendance = asyncHandler(async (req: any, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const record = await prisma.attendanceRecord.findFirst({
    where: {
      employeeId: req.user.id,
      date: today,
    },
  });
  res.json(record ? { ...record, status: fromDbStatus(record.status) } : null);
});

// @desc    Clock in for the day
// @route   POST /api/attendance/clockin
// @access  Private
export const clockIn = asyncHandler(async (req: any, res: Response) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const existingRecord = await prisma.attendanceRecord.findFirst({
    where: { employeeId: req.user.id, date: today },
  });

  if (existingRecord?.clockIn) {
    res.status(400);
    throw new Error('Already clocked in today');
  }

  const newRecord = await prisma.attendanceRecord.upsert({
    where: {
      employeeId_date: {
        employeeId: req.user.id,
        date: today,
      },
    },
    update: {
      clockIn: new Date(),
      status: toDbStatus('Present'),
    },
    create: {
      employeeId: req.user.id,
      date: today,
      clockIn: new Date(),
      status: toDbStatus('Present'),
    },
  });

  res.status(201).json({ ...newRecord, status: fromDbStatus(newRecord.status) });
});

// @desc    Clock out for the day
// @route   POST /api/attendance/clockout
// @access  Private
export const clockOut = asyncHandler(async (req: any, res: Response) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const record = await prisma.attendanceRecord.findFirst({
    where: { employeeId: req.user.id, date: today },
  });

  if (!record || !record.clockIn) {
    res.status(400);
    throw new Error('You have not clocked in today');
  }

  if (record.clockOut) {
    res.status(400);
    throw new Error('Already clocked out today');
  }

  const clockOutTime = new Date();
  const workHoursInMinutes = Math.floor((clockOutTime.getTime() - record.clockIn.getTime()) / 60000);

  const updatedRecord = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      clockOut: clockOutTime,
      workHours: workHoursInMinutes,
    },
  });

  res.json({ ...updatedRecord, status: fromDbStatus(updatedRecord.status) });
});

// @desc    Manually update attendance status (Admin/HR)
// @route   PUT /api/attendance/status
// @access  Private/Admin/HR
export const updateAttendanceStatus = asyncHandler(async (req: Request, res: Response) => {
  const { employeeId, date, status } = req.body as { employeeId: string; date: string; status: string };

  if (!employeeId || !date || !status) {
    res.status(400);
    throw new Error('Please provide employeeId, date, and status');
  }

  const recordDate = new Date(date);
  recordDate.setUTCHours(0, 0, 0, 0);

  const updatedRecord = await prisma.attendanceRecord.upsert({
    where: {
      employeeId_date: {
        employeeId,
        date: recordDate,
      },
    },
    update: { status: toDbStatus(status) },
    create: {
      employeeId,
      date: recordDate,
      status: toDbStatus(status),
    },
  });

  res.json({ ...updatedRecord, status: fromDbStatus(updatedRecord.status) });
});
