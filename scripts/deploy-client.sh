#!/bin/bash

SITE_BUCKET_NAME=$(pulumi stack output bucketName)
CDN_ID=$(pulumi stack output cdnDistributionId)

echo "Building client"
npm run build:client

echo "Syncing assets to S3 bucket: $SITE_BUCKET_NAME"
aws s3 sync app/dist s3://$SITE_BUCKET_NAME --no-progress --delete

echo "Invalidating distribution: $CDN_ID"
aws cloudfront create-invalidation --distribution-id $CDN_ID --paths "/*" > /dev/null

echo "✅ Deployment complete."
