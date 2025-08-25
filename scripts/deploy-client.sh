#!/bin/bash

SITE_BUCKET_ID=$(pulumi -C infrastructure stack output bucketId)
CDN_ID=$(pulumi -C infrastructure stack output cdnDistributionId)

echo "Building client"
npm run build:client

echo "Syncing assets to S3 bucket: $SITE_BUCKET_ID"
aws s3 sync app/dist s3://$SITE_BUCKET_ID --no-progress --delete

echo "Invalidating distribution: $CDN_ID"
aws cloudfront create-invalidation --distribution-id $CDN_ID --paths "/*" > /dev/null

echo "✅ Deployment complete."
