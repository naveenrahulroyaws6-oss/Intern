import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getAllLeaveRequests,
  getMyLeaveRequests,
  getAllLeaveBalances,
  getMyLeaveBalances,
  submitLeaveRequest,
  actionLeaveRequest,
} from '../controllers/leaveController.js';

const router = express.Router();

router.get('/', protect, getAllLeaveRequests);
router.get('/my', protect, getMyLeaveRequests);
router.get('/balances', protect, getAllLeaveBalances);
router.get('/balances/my', protect, getMyLeaveBalances);
router.post('/', protect, submitLeaveRequest);
router.put('/:id/action', protect, actionLeaveRequest);

export default router;
