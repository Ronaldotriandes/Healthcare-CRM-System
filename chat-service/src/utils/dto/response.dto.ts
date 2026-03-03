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
  code = 200;

  constructor(message?: string, result?: any) {
    super();
    this.code = 200;
    this.message = message || 'Berhasil mengambil data';
    this.result = result !== undefined ? result : null;
  }
}

export class CreatedResponseDto extends ResponseDto {
  code = 201;

  constructor(message?: string, result?: any) {
    super();
    this.code = 201;
    this.message = message || 'Berhasil dibuat';
    this.result = result !== undefined ? result : null;
  }
}
