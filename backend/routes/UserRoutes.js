import express from 'express';
import UserController from '../controllers/UserController.js';

const router = express.Router();

router.post('/login', UserController.login);
router.post('/logout', UserController.logout);
router.post('/register', UserController.register);
router.get('/profile', UserController.getProfile);
router.get('/users', UserController.getAllUsers);
router.put('/profile/update', UserController.updateProfile);
router.delete('/user/delete', UserController.deleteUser);

export default router;
