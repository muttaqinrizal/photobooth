const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs-extra');
const path = require('path');

class StorageService {
  constructor() {
    this.enabled = process.env.CLOUD_STORAGE_ENABLED === 'true';
    this.provider = process.env.CLOUD_STORAGE_PROVIDER || 'r2'; // 's3' or 'r2'
    this.bucketName = process.env.STORAGE_BUCKET_NAME;
    this.publicUrl = process.env.STORAGE_PUBLIC_URL;
    this.expirationSeconds = parseInt(process.env.STORAGE_URL_EXPIRATION_SECONDS || '86400', 10);
    this.s3Client = null;

    if (this.enabled) {
      this.initS3Client();
    } else {
      console.log('Cloud Storage integration is currently disabled in .env configuration.');
    }
  }

  /**
   * Initializes the AWS S3 / Cloudflare R2 Client
   */
  initS3Client() {
    try {
      const config = {
        credentials: {
          accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
          secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
        },
        region: process.env.STORAGE_REGION || 'auto',
      };

      // Handle R2 endpoint, or custom endpoint for S3-compatible service
      if (this.provider === 'r2' && process.env.STORAGE_ENDPOINT) {
        config.endpoint = process.env.STORAGE_ENDPOINT;
      } else if (process.env.STORAGE_ENDPOINT) {
        config.endpoint = process.env.STORAGE_ENDPOINT;
      }

      this.s3Client = new S3Client(config);
      console.log(`[StorageService] Initialized S3Client successfully for provider: ${this.provider}`);
    } catch (error) {
      console.error('[StorageService] Error initializing S3Client:', error.message);
      this.enabled = false;
    }
  }

  /**
   * Checks if cloud storage uploads are enabled and client is initialized
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled && !!this.s3Client && !!this.bucketName;
  }

  /**
   * Upload a file to S3/R2 and return the download URL
   * @param {string} localFilePath - Full path to local file
   * @param {string} destFileName - Base file name to save in bucket
   * @returns {Promise<string>} - Download URL
   */
  async uploadFile(localFilePath, destFileName) {
    if (!this.isEnabled()) {
      throw new Error('Cloud storage is not enabled or not fully configured.');
    }

    try {
      if (!await fs.pathExists(localFilePath)) {
        throw new Error(`Local file to upload not found: ${localFilePath}`);
      }

      console.log(`[StorageService] Uploading ${destFileName} to bucket ${this.bucketName}...`);
      const fileBuffer = await fs.readFile(localFilePath);
      
      // Get correct content-type
      const ext = path.extname(destFileName).toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.webp') contentType = 'image/webp';

      const uploadParams = {
        Bucket: this.bucketName,
        Key: destFileName,
        Body: fileBuffer,
        ContentType: contentType,
      };

      const putCommand = new PutObjectCommand(uploadParams);
      await this.s3Client.send(putCommand);
      console.log(`[StorageService] Upload completed successfully for: ${destFileName}`);

      // Generate the URL based on configuration
      // Scenario A: Custom Public CDN / Public Bucket URL is provided
      if (this.publicUrl) {
        const baseUrl = this.publicUrl.endsWith('/') ? this.publicUrl : `${this.publicUrl}/`;
        return `${baseUrl}${destFileName}`;
      }

      // Scenario B: Fall back to standard S3 public URL if region is defined and it's AWS S3
      if (this.provider === 's3' && !process.env.STORAGE_ENDPOINT) {
        const region = process.env.STORAGE_REGION || 'us-east-1';
        return `https://${this.bucketName}.s3.${region}.amazonaws.com/${destFileName}`;
      }

      // Scenario C: Default to generating a secure Pre-signed URL (ideal for R2 or private buckets)
      console.log(`[StorageService] Generating pre-signed GET URL (expires in ${this.expirationSeconds}s)...`);
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: destFileName,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, getCommand, {
        expiresIn: this.expirationSeconds,
      });
      return presignedUrl;

    } catch (error) {
      console.error('[StorageService] Error during file upload:', error);
      throw error;
    }
  }
}

module.exports = new StorageService();
