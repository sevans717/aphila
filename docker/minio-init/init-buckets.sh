#!/bin/bash
# ===========================================
# MINIO BUCKET INITIALIZATION SCRIPT
# ===========================================
# Creates required buckets and sets up policies for Sav3 production

set -e

echo "🗂️ Initializing MinIO buckets for aphila.io..."

# Wait for MinIO to be fully ready
echo "Waiting for MinIO to be ready..."
until mc alias set local http://minio:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD} > /dev/null 2>&1; do
  echo "MinIO not ready yet, waiting..."
  sleep 5
done

echo "MinIO is ready, starting configuration..."

# Create production buckets
echo "Creating production buckets..."

# Main media bucket
mc mb local/sav3-media-prod --ignore-existing
echo "✅ Created sav3-media-prod bucket"

# Thumbnails bucket
mc mb local/sav3-thumbnails-prod --ignore-existing
echo "✅ Created sav3-thumbnails-prod bucket"

# User avatars bucket (separate for better organization)
mc mb local/sav3-avatars-prod --ignore-existing
echo "✅ Created sav3-avatars-prod bucket"

# Temporary uploads bucket
mc mb local/sav3-temp-prod --ignore-existing
echo "✅ Created sav3-temp-prod bucket"

# Backups bucket
mc mb local/sav3-backups-prod --ignore-existing
echo "✅ Created sav3-backups-prod bucket"

# Set bucket policies
echo "Setting bucket policies..."

# Public read policy for avatars (profile pictures)
cat > /tmp/avatar-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": ["*"]
      },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::sav3-avatars-prod/*"]
    }
  ]
}
EOF

mc policy set-json /tmp/avatar-policy.json local/sav3-avatars-prod
echo "✅ Set public read policy for avatars"

# Public read policy for thumbnails
cat > /tmp/thumbnail-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": ["*"]
      },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::sav3-thumbnails-prod/*"]
    }
  ]
}
EOF

mc policy set-json /tmp/thumbnail-policy.json local/sav3-thumbnails-prod
echo "✅ Set public read policy for thumbnails"

# Private policy for main media (authenticated access only)
mc policy set private local/sav3-media-prod
echo "✅ Set private policy for main media"

# Private policy for temp uploads
mc policy set private local/sav3-temp-prod
echo "✅ Set private policy for temp uploads"

# Private policy for backups
mc policy set private local/sav3-backups-prod
echo "✅ Set private policy for backups"

# Create media access user
echo "Creating media access user..."
mc admin user add local media_user media_user_password123

# Create policy for media access user
cat > /tmp/media-user-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::sav3-media-prod/*",
        "arn:aws:s3:::sav3-thumbnails-prod/*",
        "arn:aws:s3:::sav3-avatars-prod/*",
        "arn:aws:s3:::sav3-temp-prod/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::sav3-media-prod",
        "arn:aws:s3:::sav3-thumbnails-prod",
        "arn:aws:s3:::sav3-avatars-prod",
        "arn:aws:s3:::sav3-temp-prod"
      ]
    }
  ]
}
EOF

mc admin policy create local media-access-policy /tmp/media-user-policy.json
mc admin policy attach local media-access-policy --user media_user
echo "✅ Created media access user with proper permissions"

# Set up lifecycle policies for cleanup
echo "Setting up lifecycle policies..."

# Cleanup temp uploads after 24 hours
cat > /tmp/temp-lifecycle.json <<EOF
{
  "Rules": [
    {
      "ID": "cleanup-temp-uploads",
      "Status": "Enabled",
      "Filter": {
        "Prefix": ""
      },
      "Expiration": {
        "Days": 1
      }
    }
  ]
}
EOF

mc ilm import local/sav3-temp-prod <<< '{
  "Rules": [
    {
      "ID": "cleanup-temp-uploads",
      "Status": "Enabled",
      "Filter": {
        "Prefix": ""
      },
      "Expiration": {
        "Days": 1
      }
    }
  ]
}'
echo "✅ Set 24-hour cleanup policy for temp uploads"

# Set up versioning for important buckets
mc version enable local/sav3-media-prod
mc version enable local/sav3-avatars-prod
mc version enable local/sav3-backups-prod
echo "✅ Enabled versioning for critical buckets"

# Create initial directory structure
echo "Creating directory structure..."
echo "Directory structure placeholder" | mc pipe local/sav3-media-prod/images/.keep
echo "Directory structure placeholder" | mc pipe local/sav3-media-prod/videos/.keep
echo "Directory structure placeholder" | mc pipe local/sav3-avatars-prod/profiles/.keep
echo "Directory structure placeholder" | mc pipe local/sav3-thumbnails-prod/images/.keep
echo "Directory structure placeholder" | mc pipe local/sav3-thumbnails-prod/videos/.keep
echo "✅ Created directory structure"

# Display bucket information
echo ""
echo "📊 Bucket Summary:"
mc ls local/
echo ""
echo "🔐 Bucket Policies:"
echo "- sav3-media-prod: Private (authenticated access only)"
echo "- sav3-thumbnails-prod: Public read"
echo "- sav3-avatars-prod: Public read"
echo "- sav3-temp-prod: Private (24-hour auto-cleanup)"
echo "- sav3-backups-prod: Private"
echo ""
echo "✅ MinIO bucket initialization completed successfully!"

# Clean up temporary files
rm -f /tmp/*.json
