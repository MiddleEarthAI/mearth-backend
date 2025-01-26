import type { NextFunction, Request, Response } from "express";

export interface ApiError extends Error {
	statusCode?: number;
}

export const errorHandler = (
	err: ApiError,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const statusCode = err.statusCode || 500;

	res.status(statusCode).json({
		status: "error",
		statusCode,
		message: err.message || "Internal Server Error",
		...(process.env.NODE_ENV === "development" && { stack: err.stack }),
	});
};
