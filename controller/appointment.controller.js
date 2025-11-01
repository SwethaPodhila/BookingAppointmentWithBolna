const Appointment = require("../model/appointment");
const twilio = require("twilio");
const nodemailer = require("nodemailer");

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

// ✅ Check Availability + Suggest Available Slots (Mongoose Version)
exports.checkAvailability = async (req, res) => {
  try {
    console.log("📅 [CHECK] Request Body:", req.body);

    const { doctor_name, date, time } = req.body;

    if (!doctor_name || !date || !time) {
      console.log("⚠️ Missing fields in availability check!");
      return res.status(400).json({
        success: false,
        message: "All fields are required."
      });
    }

    // ✅ Find existing appointment (Mongoose syntax)
    const existing = await Appointment.findOne({ doctor_name, date, time });

    if (existing) {
      console.log("⛔ Slot not available:", { doctor_name, date, time });

      // 🔍 Fetch all booked slots for that doctor on the same date
      const bookedSlots = await Appointment.find(
        { doctor_name, date },
        "time" // only fetch time field
      );

      const bookedTimes = bookedSlots.map((s) => s.time);

      // Define possible slots
      const allSlots = [
        "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
        "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
        "05:00 PM", "06:00 PM", "07:00 PM"
      ];

      // Filter available ones
      const availableSlots = allSlots.filter(
        (slot) => !bookedTimes.includes(slot)
      );

      return res.status(200).json({
        success: false,
        available: false,
        message: "That time slot is already booked.",
        available_slots: availableSlots
      });
    }

    console.log("✅ Slot available for:", { doctor_name, date, time });
    return res.status(200).json({
      success: true,
      available: true,
      message: "Doctor is available for that time slot."
    });

  } catch (error) {
    console.error("❌ Error checking availability:", error);
    return res.status(500).json({
      success: false,
      message: "Server error."
    });
  }
};

// ✅ 2. Book Appointment
exports.bookAppointment = async (req, res) => {
  try {
    console.log("📥 [BOOK] Received booking request:", req.body);

    const { doctor_name, date, time, name, email, phone } = req.body;

    if (!doctor_name || !date || !time || !name || !email || !phone) {
      console.log("⚠️ Missing booking fields!");
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const existing = await Appointment.findOne({ where: { doctor_name, date, time } });
    if (existing) {
      console.log("⛔ Duplicate booking attempt:", { doctor_name, date, time });
      return res.status(400).json({
        success: false,
        message: "Sorry, that time slot has just been booked. Please choose another.",
      });
    }

    console.log("💾 Saving appointment to DB...");
    const appointment = await Appointment.create({ doctor_name, date, time, name, email, phone });
    console.log("✅ Appointment saved:", appointment);

    // ✅ Send email via Nodemailer
    console.log("📤 Sending confirmation email...");
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // you can use Gmail, Outlook, etc.
      auth: {
        user: process.env.EMAIL_USER,  // your email
        pass: process.env.EMAIL_PASS,  // your email app password
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Appointment Confirmation",
      text: `Hello ${name}, your appointment with ${doctor_name} is confirmed!\n\n🗓️ Date: ${date}\n⏰ Time: ${time}\n\nThank you for booking with us.`,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Confirmation email sent successfully!");

    return res.status(201).json({
      success: true,
      message: `Appointment booked successfully with ${doctor_name}. Confirmation email sent.`,
      data: appointment,
    });

  } catch (error) {
    console.error("❌ Error booking appointment:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
