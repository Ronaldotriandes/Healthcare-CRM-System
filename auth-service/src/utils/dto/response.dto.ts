import { ResponseMessageEnum } from '../enum/response.enum';

export interface ApiResponse {
  code: number;
  success?: boolean;
  message?: string;
  result?: any;
}

export class ResponseDto {
  code?: number = 200;
  success?: boolean = true;
  message?: string = '';
  result?: any;

  constructor(message?: string, result?: any) {
    if (message) this.message = message;
    if (result !== undefined) this.result = result;
  }
}

export class GetResponseDto extends ResponseDto {
  code: number = 200;
  message: string = ResponseMessageEnum.Get;
  result: any = null;

  constructor(message?: string, result?: any) {
    super();
    this.code = 200;
    this.message = message || ResponseMessageEnum.Post;
    this.result = result !== undefined ? result : null;
  }
}

export class CreatedResponseDto extends ResponseDto {
  code: number = 201;
  message: string = ResponseMessageEnum.Post;
  result: any = null;

  constructor(message?: string, result?: any) {
    super();
    this.code = 201;
    this.message = message || ResponseMessageEnum.Post;
    this.result = result !== undefined ? result : null;
  }
}

export class UpdatedResponseDto extends ResponseDto {
  code: number = 200;
  message: string = ResponseMessageEnum.Update;
  result: any = null;

  constructor(message?: string, result?: any) {
    super();
    this.code = 200;
    this.message = message || ResponseMessageEnum.Update;
    this.result = result !== undefined ? result : null;
  }
}

export class DeletedResponseDto extends ResponseDto {
  code: number = 200;
  message: string = ResponseMessageEnum.Delete;
  result: any = null;

  constructor(message?: string, result?: any) {
    super();
    this.code = 200;
    this.message = message || ResponseMessageEnum.Delete;
    this.result = result !== undefined ? result : null;
  }
}

export class EnumDto {
  enum: string;
  value: string;
}

export class ServiceResponse {
  code: number;
  message: string;
  result: any = null;
  success: boolean;
}
