import type { NextFunction, Request, Response } from "express";

export const notFoundHandler = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	res.status(404).json({
		status: "error",
		statusCode: 404,
		message: `Cannot ${req.method} ${req.url}`,
	});
};
