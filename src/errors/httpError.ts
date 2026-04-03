export class HttpError extends Error {
  readonly statusCode: number;
  readonly errors?: Array<{ field: string; message: string }>;

  constructor(statusCode: number, message: string, errors?: Array<{ field: string; message: string }>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
