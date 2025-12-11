import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import '../config.js';

const s3 = new S3Client({ 
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.S3_BUCKET;

// 1. Upload File (buffer or local file)
export async function uploadFile({ fileBuffer, filePath, key, directory = "", contentType = "application/octet-stream" }) {
  try {
    const finalKey = directory ? `${directory}/${key}` : key;

    let Body = fileBuffer;
    if (!fileBuffer && filePath) {
      Body = fs.readFileSync(filePath);
    }

    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: finalKey,
      Body,
      ContentType: contentType,
    });

    await s3.send(cmd);

    return {
      success: true,
      key: finalKey,
      url: `https://${BUCKET}.s3.amazonaws.com/${finalKey}`,
    };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw error;
  }
}

// 2. Get Signed URL to Fetch File
export async function getFileUrl({ key, directory = "", expiresIn = 3600 }) {
  try {
    const finalKey = directory ? `${directory}/${key}` : key;

    const cmd = new GetObjectCommand({
      Bucket: BUCKET,
      Key: finalKey,
    });

    const url = await getSignedUrl(s3, cmd, { expiresIn });

    return { success: true, url };
  } catch (error) {
    console.error("S3 Fetch Error:", error);
    throw error;
  }
}

// 3. List Files (supports folders)
export async function listFiles(prefix = "") {
  try {
    const cmd = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,  // directory like "uploads/" or ""
    });

    const result = await s3.send(cmd);

    const files = (result.Contents || []).map((item) => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
    }));

    return { success: true, files };
  } catch (error) {
    console.error("S3 List Error:", error);
    throw error;
  }
}

// 4. Delete File
export async function deleteFile({ key, directory = "" }) {
  try {
    const finalKey = directory ? `${directory}/${key}` : key;

    const cmd = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: finalKey,
    });

    await s3.send(cmd);

    return { success: true, deletedKey: finalKey };
  } catch (error) {
    console.error("S3 Delete Error:", error);
    throw error;
  }
}

// 5. Upload Compressed Image (WebP)
export async function uploadCompressedImage({
  fileBuffer,
  key,
  directory = "",
  width = 800,
  quality = 50
}) {
  try {
    // Process image: Resize -> WebP -> Buffer
    const processedBuffer = await sharp(fileBuffer)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    // Ensure extension is .webp
    const keyBase = key.replace(/\.[^/.]+$/, ""); // Strip existing extension if any
    const finalKey = `${keyBase}.webp`;

    // Re-use standard upload function
    return await uploadFile({
      fileBuffer: processedBuffer,
      key: finalKey,
      directory,
      contentType: "image/webp"
    });
  } catch (error) {
    console.error("Compression Upload Error:", error);
    throw error;
  }
}


