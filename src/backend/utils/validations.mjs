// utils/handleValidation.js
import { validationResult } from "express-validator";

export function handleValidation(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return false; // signal invalid
  }

  return true; // signal valid
}
