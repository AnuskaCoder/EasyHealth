/**
 * Resource Ownership & HIPAA Consent Middleware
 * Enforces strict authorization policies:
 * - Patients can only access their own records/appointments
 * - Doctors can only access patient records if granted active consent
 */
const { mem: db } = require("../config/database");
const recordRepository = require("../repositories/recordRepository");
const appointmentRepository = require("../repositories/appointmentRepository");
const doctorRepository = require("../repositories/doctorRepository");

async function checkRecordOwnership(req, res, next) {
  try {
    const recordId = req.params.id;
    if (!recordId) return next();

    const record = await recordRepository.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, error: "Record not found", code: 404 });
    }

    // If patient, must be the owner
    if (req.user.role === "patient") {
      if (record.patientId !== req.user.id) {
        return res.status(403).json({ success: false, error: "Access denied: Unauthorized access to record", code: 403 });
      }
      return next();
    }

    // If doctor, check consent permission
    if (req.user.role === "doctor") {
      const doctor = await doctorRepository.findByUserId(req.user.id);
      const doctorId = doctor ? doctor.id : req.user.id;

      const hasConsent = db.consentPermissions.some(
        c => c.patientId === record.patientId &&
             (c.doctorId === doctorId || c.doctorId === req.user.id) &&
             c.status === "granted" &&
             (!c.expiresAt || new Date(c.expiresAt) > new Date())
      );

      if (!hasConsent) {
        return res.status(403).json({
          success: false,
          error: "HIPAA Gating: Active patient consent is required to view this medical record",
          code: 403
        });
      }
      return next();
    }

    return next();
  } catch (err) {
    next(err);
  }
}

async function checkAppointmentOwnership(req, res, next) {
  try {
    const apptId = req.params.id;
    if (!apptId) return next();

    const appt = await appointmentRepository.findById(apptId);
    if (!appt) {
      return res.status(404).json({ success: false, error: "Appointment not found", code: 404 });
    }

    if (req.user.role === "patient" && appt.patientId !== req.user.id) {
      return res.status(403).json({ success: false, error: "Access denied to appointment", code: 403 });
    }

    if (req.user.role === "doctor") {
      const doctor = await doctorRepository.findByUserId(req.user.id);
      const doctorId = doctor ? doctor.id : req.user.id;
      if (appt.doctorId !== doctorId && appt.doctorId !== req.user.id) {
        return res.status(403).json({ success: false, error: "Access denied to appointment", code: 403 });
      }
    }

    return next();
  } catch (err) {
    next(err);
  }
}

module.exports = { checkRecordOwnership, checkAppointmentOwnership };
