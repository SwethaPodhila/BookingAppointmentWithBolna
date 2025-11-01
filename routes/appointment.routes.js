// routes/appointmentRoutes.js
const express = require("express");
const router = express.Router();
const { checkAvailability, bookAppointment } = require("../controller/appointment.controller");

router.post("/check-availability", checkAvailability);
router.post("/book-appointment", bookAppointment);

module.exports = router;