export class AppError extends Error {
    constructor(
        message: string,
        public readonly statusCode = 500,
        public readonly code = "INTERNAL_ERROR",
        public readonly details?: unknown, 
    )  {
        super(message);
        this.name = new.target.name;
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(message, 404, "NOT FOUND");
    }
}

export class NotAuthorizedError extends AppError {
    constructor(message = "Resource not authorized") {
        super(message, 401, "NOT AUTHORIZED");
    }
}