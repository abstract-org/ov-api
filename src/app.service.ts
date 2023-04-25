import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getOK(): string {
    return 'OpenValue API: OK';
  }
}
