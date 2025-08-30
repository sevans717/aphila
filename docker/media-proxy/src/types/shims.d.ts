declare module "compression" {
  const compression: any;
  export default compression;
}

declare module "rate-limiter-flexible" {
  export class RateLimiterRedis {
    constructor(opts?: any);
    consume(key: string, points?: number): Promise<any>;
  }
}

declare module "multer" {
  const multer: any;
  export default multer;
}

declare module "file-type" {
  export function fileTypeFromBuffer(
    buf: Buffer
  ): Promise<{ mime: string; ext: string } | undefined>;
}

declare module "winston" {
  const winston: any;
  export default winston;
}

declare module "minio" {
  const Minio: any;
  export = Minio;
}
