import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadAvatar,
} from '../controllers/employeeController.js';

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.get('/', protect, getEmployees);
router.post('/', protect, createEmployee);
router.put('/:id', protect, updateEmployee);
router.delete('/:id', protect, deleteEmployee);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

export default router;
