import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) { }
    private readonly logger = new Logger('api');

    catch(exception: unknown, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();

        let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: any = exception;
        this.logger.error(`exception : ${exception}`);
        if (exception instanceof HttpException) {
            httpStatus = exception.getStatus();
        } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            const prismaError = prismaErrorHandler(exception);
            httpStatus = prismaError.httpStatus;
            message = prismaError.message;
        } else if (exception instanceof PrismaClientValidationError) {
            message = exception.message;
        }
        console.log(`exception : ${message}`);

        const { response } = message;
        if (response) {
            const { message: respMsg } = response;
            message = respMsg;
        }

        const responseBody = {
            statusCode: httpStatus,
            timestamp: new Date().toISOString(),
            message: message,
            path: httpAdapter.getRequestUrl(ctx.getRequest()),
        };

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
}

const prismaErrorHandler = (e: Prisma.PrismaClientKnownRequestError) => {
    switch (e.code) {
        case 'P2002':
            return {
                httpStatus: HttpStatus.CONFLICT,
                message: `data sudah ada`,
            };
        case 'P2003':
            return {
                httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
                message: `data tidak ditemukan ${e.meta?.field_name}`,
            };
        case 'P2025':
            return {
                httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
                message: `data tidak ditemukan`,
            };
    }

    return {
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `terjadi kesalahan pada sistem, ${e}`,
    };
};
