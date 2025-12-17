
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, 'temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Generates a unique temporary file path with the given extension.
 * @param {string} extension - File extension (e.g., 'xlsx', 'pdf').
 * @param {string} prefix - Optional prefix for the filename.
 * @returns {string} Absolute path to the temporary file.
 */
export function getTempFilePath(extension, prefix = 'temp') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const filename = `${prefix}_${timestamp}_${random}.${extension}`;
    return path.join(TEMP_DIR, filename);
}

/**
 * Deletes a file if it exists.
 * @param {string} filePath - Absolute path to the file to delete.
 */
export function cleanTempFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            // console.log(`Temp file cleaned: ${filePath}`);
        }
    } catch (err) {
        console.error(`Error cleaning temp file ${filePath}:`, err);
    }
}
