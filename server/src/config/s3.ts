import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';

let client: S3Client | null = null;

// One shared client, created the first time a photo is uploaded
export function getS3Client() {
  if (!client) {
    client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

// Public URL of an object in our bucket (only the public/ folder is readable)
export function publicUrl(key: string) {
  return `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

export function bucketHost() {
  return `${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`;
}
