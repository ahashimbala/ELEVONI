import express from "express"
import { loginUser, registerUser, googleLogin, currentUser } from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";
const userRouter = express.Router()

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)
userRouter.post("/google", googleLogin)
userRouter.get("/me", authMiddleware, currentUser)
export default userRouter;
