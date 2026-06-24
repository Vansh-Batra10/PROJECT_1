import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export interface StoredFile {
  filePath: string; // path/key to hand back to StorageService.read()
}

/**
 * Abstraction over file storage so the dev (local disk) backend can be swapped
 * for S3 later without touching callers.
 */
export class StorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  }

  async save(buffer: Buffer, originalName: string): Promise<StoredFile> {
    await fs.mkdir(this.baseDir, { recursive: true });
    const ext = path.extname(originalName);
    const key = `${crypto.randomUUID()}${ext}`;
    const fullPath = path.join(this.baseDir, key);
    await fs.writeFile(fullPath, buffer);
    return { filePath: key };
  }

  async read(filePath: string): Promise<Buffer> {
    return fs.readFile(path.join(this.baseDir, filePath));
  }
}
