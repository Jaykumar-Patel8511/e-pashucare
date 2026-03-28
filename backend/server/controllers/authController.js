const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { sendMail } = require("../services/mailService");

const FIXED_ADMIN_EMAIL = "jaykumarpatel@gmail.com";
const FIXED_ADMIN_PASSWORD = "admin@123";

function generateOtp() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" }
  );
}

async function register(req, res) {
  const {
    name,
    email,
    password,
    role,
    sabhasadId,
    dairyId,
    mobile,
    address,
    location,
    isSabhasadMember,
    specialization,
  } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOtp();

  await Otp.findOneAndUpdate(
    { email },
    {
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      payload: {
        name,
        email,
        password: hashedPassword,
        role,
        phone: mobile,
        sabhasadId,
        dairyId,
        mobile,
        address,
        location,
        isSabhasadMember,
        specialization,
      },
    },
    { upsert: true }
  );

  await sendMail({
    to: email,
    subject: "e-PashuCare OTP Verification",
    text: `Your OTP is ${otp}. It expires in 10 minutes.`,
  });

  return res.status(201).json({ message: "OTP sent to email" });
}

async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  const otpRecord = await Otp.findOne({ email });

  if (!otpRecord || otpRecord.otp !== otp || otpRecord.expiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  const user = await User.create({
    ...otpRecord.payload,
    isVerified: true,
  });

  await Otp.deleteOne({ _id: otpRecord._id });

  const token = signToken(user);
  return res.status(200).json({ token, user });
}

async function login(req, res) {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").toLowerCase().trim();

  if (normalizedEmail === FIXED_ADMIN_EMAIL && password === FIXED_ADMIN_PASSWORD) {
    const fixedAdminUser = {
      _id: "admin-root",
      name: "Admin",
      email: FIXED_ADMIN_EMAIL,
      role: "admin",
    };

    const token = signToken(fixedAdminUser);
    return res.status(200).json({ token, user: fixedAdminUser });
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const matched = await bcrypt.compare(password, user.password);
  if (!matched) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken(user);
  return res.status(200).json({ token, user });
}

module.exports = {
  register,
  verifyOtp,
  login,
};
