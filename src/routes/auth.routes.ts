// import { forgotPassword, loginUser, registerUser } from '../controllers/auth.controller';

import { authMiddleware } from '../middlewares/auth';
import { forgotPassword, loginUser, logoutUser, registerUser, resetPassword, updateProfile } from '../controllers/auth.controller';
import { Router } from 'express';
import upload  from '../Helper/uploadMiddleware';

const router = Router();

router.post('/register', registerUser);

router.post('/login', loginUser);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password', resetPassword);

router.put("/profile-update", authMiddleware, upload.single("profile_picture"), updateProfile);

router.post("/logoutUser", authMiddleware, logoutUser);



export default router;
