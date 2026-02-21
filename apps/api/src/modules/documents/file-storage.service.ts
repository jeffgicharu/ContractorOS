export interface FileStorageService {
  save(
    orgId: string,
    contractorId: string,
    fileId: string,
    fileName: string,
    buffer: Buffer,
  ): Promise<string>;
  read(filePath: string): Promise<Buffer>;
  delete(filePath: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
}

export const FILE_STORAGE_SERVICE = 'FILE_STORAGE_SERVICE';
