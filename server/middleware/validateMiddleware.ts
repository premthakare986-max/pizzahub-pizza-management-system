import { Request, Response, NextFunction } from 'express';

export function validateRequiredFields(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || typeof req.body !== 'object') {
      req.body = {};
    }

    // Normalize mobile_number <-> phone so both field names are consistently supported
    if (req.body.mobile_number !== undefined && req.body.phone === undefined) {
      req.body.phone = req.body.mobile_number;
    } else if (req.body.phone !== undefined && req.body.mobile_number === undefined) {
      req.body.mobile_number = req.body.phone;
    }

    // Normalize address <-> street_address if address is passed as a string or object
    if (typeof req.body.address === 'string' && req.body.street_address === undefined) {
      req.body.street_address = req.body.address;
    } else if (
      req.body.address &&
      typeof req.body.address === 'object' &&
      !Array.isArray(req.body.address)
    ) {
      if (req.body.address.street_address && req.body.street_address === undefined) {
        req.body.street_address = req.body.address.street_address;
      }
      if (req.body.address.city && req.body.city === undefined) {
        req.body.city = req.body.address.city;
      }
      if (req.body.address.state && req.body.state === undefined) {
        req.body.state = req.body.address.state;
      }
      if (req.body.address.postal_code && req.body.postal_code === undefined) {
        req.body.postal_code = req.body.address.postal_code;
      }
    }

    const missing: string[] = [];
    for (const field of fields) {
      const val = req.body?.[field];
      if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Validation error: Missing required field(s): ${missing.join(', ')}`,
        missingFields: missing,
      });
    }

    next();
  };
}
