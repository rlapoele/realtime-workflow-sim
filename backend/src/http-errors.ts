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
