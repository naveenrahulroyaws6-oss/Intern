import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';

const router = express.Router();

router.get('/', protect, getDepartments);
router.post('/', protect, createDepartment);
router.put('/:id', protect, updateDepartment);
router.delete('/:id', protect, deleteDepartment);

export default router;
