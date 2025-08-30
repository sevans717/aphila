declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        roles?: string[];
        id: string;
      };
      validatedQuery?: any;
      file?: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      };
      files?:
        | {
            [fieldname: string]: {
              fieldname: string;
              originalname: string;
              encoding: string;
              mimetype: string;
              size: number;
              destination: string;
              filename: string;
              path: string;
              buffer: Buffer;
            }[];
          }
        | {
            fieldname: string;
            originalname: string;
            encoding: string;
            mimetype: string;
            size: number;
            destination: string;
            filename: string;
            path: string;
            buffer: Buffer;
          }[];
    }
  }
}

export {};
