import { HttpException, HttpStatus } from "@nestjs/common";

export function notFound(message: string): HttpException {
  return new HttpException(
    {
      error: {
        code: "not_found",
        message,
      },
    },
    HttpStatus.NOT_FOUND,
  );
}

export function tooManyRequests(message: string): HttpException {
  return new HttpException(
    {
      error: {
        code: "too_many_requests",
        message,
      },
    },
    HttpStatus.TOO_MANY_REQUESTS,
  );
}
