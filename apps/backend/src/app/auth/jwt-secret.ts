import { environment } from '../../environments/environment.js';

export const getJwtSecret = (): string => environment.jwt.secret;
