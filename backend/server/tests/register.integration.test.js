const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

const registerRoutes = require("../routes/registerRoutes");
const User = require("../models/User");

let mongo;
let app;

test.before(async () => {
  mongo = await MongoMemoryServer.create({
    instance: { dbName: "epashucare-test" },
  });

  await mongoose.connect(mongo.getUri());

  app = express();
  app.use(express.json());
  app.use("/api/register", registerRoutes);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ message: err.message || "Internal Server Error" });
  });
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
});

test.beforeEach(async () => {
  await User.deleteMany({});
});

function basePayload(overrides = {}) {
  return {
    name: "Ravi Farmer",
    email: "ravi@example.com",
    password: "secret12",
    role: "farmer",
    phone: "9876543210",
    pincode: "226001",
    address: "Near Dairy Gate",
    village: "Lucknow Village",
    city: "Lucknow",
    district: "Lucknow",
    state: "Uttar Pradesh",
    latitude: 26.8467,
    longitude: 80.9462,
    sabhasadId: "SAB-1001",
    dairyId: "D-501",
    isSabhasadMember: true,
    ...overrides,
  };
}

test("POST /api/register creates farmer and returns token", async () => {
  const response = await request(app).post("/api/register").send(basePayload());

  assert.equal(response.status, 201);
  assert.equal(response.body.message, "Account created successfully");
  assert.ok(response.body.token);
  assert.equal(response.body.user.role, "farmer");
  assert.ok(response.body.user._id);

  const saved = await User.findOne({ email: "ravi@example.com" });
  assert.ok(saved);
  assert.equal(saved.phone, "9876543210");
  assert.equal(saved.location.lat, 26.8467);
  assert.equal(saved.location.long, 80.9462);
});

test("POST /api/register rejects duplicate doctorId", async () => {
  const doctorPayload = {
    name: "Dr. Asha",
    email: "asha1@example.com",
    password: "Secret@12",
    role: "doctor",
    phone: "9998887776",
    pincode: "110001",
    address: "Clinic Road",
    village: "Connaught Place",
    city: "New Delhi",
    district: "New Delhi",
    state: "Delhi",
    latitude: 28.6139,
    longitude: 77.209,
    doctorId: "DOC-778",
    doctorCategory: "General",
  };

  const first = await request(app).post("/api/register").send(doctorPayload);
  assert.equal(first.status, 201);

  const duplicate = await request(app)
    .post("/api/register")
    .send({ ...doctorPayload, email: "asha2@example.com" });

  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.message, "Doctor ID already exists");
});

test("POST /api/register rejects invalid pincode", async () => {
  const response = await request(app)
    .post("/api/register")
    .send(basePayload({ pincode: "12345" }));

  assert.equal(response.status, 400);
  assert.ok(Array.isArray(response.body.errors));
  assert.ok(response.body.errors.some((item) => item.msg.includes("Pincode")));
});

test("POST /api/register rejects duplicate email", async () => {
  const first = await request(app).post("/api/register").send(basePayload());
  assert.equal(first.status, 201);

  const duplicate = await request(app).post("/api/register").send(basePayload());
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.message, "Email already exists");
});

test("POST /api/register allows non-Sabhasad farmer without sabhasadId and dairyId", async () => {
  const response = await request(app)
    .post("/api/register")
    .send(
      basePayload({
        email: "nonsabhasad@example.com",
        isSabhasadMember: false,
        sabhasadMember: false,
        sabhasadId: null,
        dairyId: null,
      })
    );

  assert.equal(response.status, 201);
  const saved = await User.findOne({ email: "nonsabhasad@example.com" });
  assert.ok(saved);
  assert.equal(saved.sabhasadMember, false);
  assert.equal(saved.isSabhasadMember, false);
  assert.equal(saved.sabhasadId, null);
  assert.equal(saved.dairyId, null);
});

test("POST /api/register rejects Sabhasad farmer when IDs are missing", async () => {
  const response = await request(app)
    .post("/api/register")
    .send(
      basePayload({
        email: "missingids@example.com",
        isSabhasadMember: true,
        sabhasadMember: true,
        sabhasadId: "",
        dairyId: "",
      })
    );

  assert.equal(response.status, 400);
  assert.ok(Array.isArray(response.body.errors));
  assert.ok(response.body.errors.some((item) => item.msg.includes("Sabhasad ID")));
  assert.ok(response.body.errors.some((item) => item.msg.includes("Dairy ID")));
});
