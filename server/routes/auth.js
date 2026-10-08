import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
const tokenFor = (user) =>
  jwt.sign(
    { id: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (
      !name?.trim() ||
      !/^\S+@\S+\.\S+$/.test(email || "") ||
      typeof password !== "string" ||
      password.length < 8
    )
      return res
        .status(400)
        .json({
          error:
            "Name, valid email and password of at least 8 characters are required",
        });
    if (await User.exists({ email: email.toLowerCase() }))
      return res
        .status(409)
        .json({ error: "An account with this email already exists" });
    const user = await User.create({
      name: name.trim(),
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });
    res
      .status(201)
      .json({
        token: tokenFor(user),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          cashBalance: user.cashBalance,
        },
      });
  } catch (e) {
    next(e);
  }
});
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      email: String(email || "").toLowerCase(),
    });
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash)))
      return res.status(401).json({ error: "Invalid email or password" });
    res.json({
      token: tokenFor(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        cashBalance: user.cashBalance,
      },
    });
  } catch (e) {
    next(e);
  }
});
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const u = await User.findById(req.user.id).select("-passwordHash");
    if (!u) return res.status(404).json({ error: "Account not found" });
    res.json({ user: u });
  } catch (e) {
    next(e);
  }
});
export default router;
