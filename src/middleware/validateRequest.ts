import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

/**
 * Middleware to validate request using express-validator
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction
 * @returns void
 */
export const validateRequest = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.status(400).json({
			status: "error",
			errors: errors.array(),
		});
		return;
	}
	next();
};
