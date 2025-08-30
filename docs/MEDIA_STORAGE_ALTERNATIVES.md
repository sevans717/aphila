# Media Storage Alternatives

This document outlines the self-hosted media storage alternatives implemented as an alternative to AWS S3 for the SAV3 backend. The system provides multiple storage backends with automatic fallback, presigned upload capabilities, and seamless integration.

## Overview

The media storage system supports four storage backends in order of preference:

1. **MinIO** (Primary) - Self-hosted S3-compatible object storage
2. **AWS S3** (Fallback) - Cloud-based object storage
3. **Media Proxy** (Local proxy) - Self-hosted media server with processing
4. **Local Storage** (Dev fallback) - Direct filesystem storage

## Architecture

```mermaid
Frontend → API Gateway → Media Service → [MinIO|S3|Media-Proxy|Local]
    ↓           ↓            ↓              ↓
 Presigned   Validation   Storage      Image Processing
   URLs      & Metadata   Backend       & Thumbnails
```

## Components

### 1. MinIO Stack

MinIO provides S3-compatible object storage with clustering, versioning, and lifecycle management.

**Docker Services:**

- `minio`: MinIO server (host port 10090 -> container 9000)
- `minio-init`: Bucket and policy initialization

**Configuration:**

```yaml
# docker-compose.media.yml
minio:
  image: minio/minio:latest
  ports:
  - "10090:9000"
    - "9001:9001"
  environment:
    - MINIO_ROOT_USER=minioadmin
    - MINIO_ROOT_PASSWORD=minioadmin
  command: server /data --console-address ":9001"
  volumes:
    - minio_data:/data
```

**Buckets:**

- `sav3-media`: Primary media storage
- `sav3-thumbnails`: Generated thumbnails
- `sav3-temp`: Temporary/chunked uploads

### 2. Media Proxy

A Node.js/Express service that handles uploads, image processing, and serving with Redis caching.

**Features:**

- File upload with validation
- Image resizing and optimization
- Thumbnail generation
- Redis caching for performance
- Rate limiting and authentication
- Health monitoring

**Endpoints:**

- `POST /api/upload` - File upload
- `GET /api/media/:key` - File retrieval
- `DELETE /api/media/:key` - File deletion
- `GET /api/health` - Health check

### 3. Image Processor

Dedicated service for image/video processing using Sharp and FFmpeg.

**Features:**

- Image resizing and format conversion
- Thumbnail generation
- Video processing and thumbnails
- Metadata extraction
- Quality optimization

### 4. Redis Cache

Caching layer for media metadata and frequently accessed files.

**Configuration:**

- Port: 6379
- Memory limit: 256MB
- Persistence: RDB snapshots
- Eviction: allkeys-lru

## Storage Backend Selection

The MediaService automatically selects the best available storage backend:

```typescript
// Priority order in MediaService.uploadFile()
if (this.minioClient && process.env.MINIO_BUCKET_NAME) {
  // Upload to MinIO
  url = await this.uploadToMinIO(filename, file.buffer, file.mimetype);
} else if (this.s3 && env.s3BucketName) {
  // Upload to S3
} else if (this.mediaProxyUrl) {
  // Upload via media-proxy
} else {
  // Upload to local storage
}
```

## Environment Variables

### MinIO Configuration

```bash
MINIO_ENDPOINT=localhost
MINIO_PORT=10090
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=sav3-media
MINIO_USE_SSL=false
```

### Media Proxy Configuration

```bash
MEDIA_PROXY_URL=http://localhost:10020
```

### AWS S3 Configuration (Fallback)

```bash
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
```

## API Integration

### Presigned Upload URLs

The system supports presigned URLs for direct client uploads:

```typescript
// Generate presigned URL
const result = await MediaService.generatePresignedUploadUrl(
  userId,
  'photo.jpg',
  'image/jpeg',
  3600 // 1 hour expiry
);

// Returns:
{
  uploadUrl: 'http://localhost:10090/sav3-media/user123/uuid.jpg?...',
  key: 'user123/uuid.jpg',
  expiresIn: 3600,
  method: 'PUT',
  headers: { 'Content-Type': 'image/jpeg' }
}
```

### File Upload Flow

1. **Client Request**: Request presigned URL from API
2. **API Response**: Return presigned URL with metadata
3. **Client Upload**: Direct upload to storage backend
4. **Confirmation**: Optional webhook/callback to confirm upload
5. **Database Update**: Update media asset record

### Chunked Upload Support

For large files, the system supports chunked uploads:

```typescript
// Start chunked upload session
const sessionId = MediaService.startChunkedUpload(
  userId,
  "large-video.mp4",
  100_000_000 // 100MB
);

// Upload chunks
for (let i = 0; i < totalChunks; i++) {
  const progress = MediaService.uploadChunk(sessionId, i, chunkBuffer);
  // Update UI with progress
}

// Complete upload
const result = await MediaService.completeChunkedUpload(sessionId);
```

## Deployment

### Local Development

```bash
# Start media stack
docker-compose -f docker-compose.media.yml up -d

# Check services
docker-compose -f docker-compose.media.yml ps

# View logs
docker-compose -f docker-compose.media.yml logs -f minio media-proxy
```

### Production Deployment

1. **MinIO Cluster**: Deploy MinIO in distributed mode for high availability
2. **Load Balancing**: Use Traefik/nginx for load balancing and SSL termination
3. **Storage**: Use external storage volumes or network-attached storage
4. **Monitoring**: Enable Prometheus metrics and alerting
5. **Backup**: Configure automated backups and replication

### Health Monitoring

Each service provides health endpoints:

- MinIO: `http://localhost:10090/minio/health/live`
- Media Proxy: `http://localhost:10020/api/health`
- Redis: `PING` command via CLI

### Scripts

```bash
# Check media stack health
./scripts/check-media-health.sh

# Backup media data
./scripts/backup-media-data.sh

# Monitor media usage
./scripts/monitor-media-usage.sh
```

## Security

### Access Control

- **MinIO**: Bucket policies restrict access by user ID
- **Media Proxy**: JWT authentication for uploads
- **Redis**: Protected with AUTH password
- **Network**: Services isolated in Docker network

### File Validation

- **Type checking**: MIME type validation
- **Size limits**: Configurable per file type
- **Virus scanning**: Optional ClamAV integration
- **Content analysis**: Image/video metadata extraction

### Encryption

- **At Rest**: MinIO supports encryption at rest
- **In Transit**: TLS/HTTPS for all connections
- **Client-side**: Optional client-side encryption

## Performance

### Caching Strategy

- **Redis**: Cache frequently accessed metadata
- **CDN**: Optional CDN integration for global distribution
- **Local**: Browser caching with proper headers

### Optimization

- **Image Processing**: Automatic resizing and optimization
- **Lazy Loading**: Progressive image loading on frontend
- **Compression**: Automatic compression for supported formats

## Monitoring & Metrics

### Prometheus Metrics

- **Storage usage**: Bytes stored per user/bucket
- **Upload rates**: Files per second/minute
- **Error rates**: Failed uploads/downloads
- **Response times**: P50/P95/P99 latencies

### Grafana Dashboards

- **Media Overview**: Storage usage, upload trends
- **Performance**: Response times, error rates
- **Capacity**: Disk usage, growth projections

## Troubleshooting

### Common Issues

1. **MinIO connection failed**
   - Check MINIO_ENDPOINT and network connectivity
   - Verify credentials and bucket policies

2. **Upload timeouts**
   - Check file size limits
   - Verify network bandwidth and latency

3. **Permission denied**
   - Check bucket policies and user permissions
   - Verify JWT token and authentication

### Debug Commands

```bash
# Test MinIO connectivity
mc alias set local http://localhost:10090 minioadmin minioadmin
mc ls local/sav3-media

# Check media proxy logs
docker logs sav3-media-proxy

# Test Redis connection
redis-cli -h localhost -p 6379 PING
```

## Migration Guide

### From S3 to MinIO

1. **Data Migration**: Use `aws s3 sync` or MinIO client
2. **Configuration**: Update environment variables
3. **DNS**: Update CNAME records if using custom domains
4. **Testing**: Verify upload/download functionality

### From Local Storage

1. **File Transfer**: Copy files to MinIO buckets
2. **URL Updates**: Update database URLs to MinIO format
3. **Path Mapping**: Update client-side URL handling

## Future Enhancements

- **Multi-region replication**: Automatic data replication
- **CDN integration**: CloudFlare/CloudFront integration
- **Advanced processing**: ML-based content analysis
- **Streaming uploads**: Direct streaming for large files
- **Blockchain storage**: IPFS integration for decentralized storage

## Conclusion

This media storage system provides a robust, scalable, and self-hosted alternative to cloud storage services while maintaining compatibility with existing S3-based workflows. The multi-backend approach ensures high availability and performance while reducing vendor lock-in.
