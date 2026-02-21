import { NotFoundException } from '@nestjs/common';
import { LocalFileStorageService } from './local-file-storage.service';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('LocalFileStorageService', () => {
  let service: LocalFileStorageService;
  const testBaseDir = path.join(process.cwd(), 'uploads', 'documents');
  const testOrgId = 'test-org';
  const testContractorId = 'test-contractor';
  const testFileId = 'test-file-id';
  const testFileName = 'test-document.pdf';
  const testBuffer = Buffer.from('test file content');

  beforeEach(() => {
    service = new LocalFileStorageService();
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(path.join(testBaseDir, testOrgId), { recursive: true });
    } catch {
      // Ignore if doesn't exist
    }
  });

  describe('save', () => {
    it('should create directory and write file', async () => {
      const filePath = await service.save(testOrgId, testContractorId, testFileId, testFileName, testBuffer);

      expect(filePath).toContain(testOrgId);
      expect(filePath).toContain(testContractorId);
      expect(filePath).toContain(testFileId);

      const fullPath = path.join(testBaseDir, filePath);
      const content = await fs.readFile(fullPath);
      expect(content).toEqual(testBuffer);
    });

    it('should return relative path from base dir', async () => {
      const filePath = await service.save(testOrgId, testContractorId, testFileId, testFileName, testBuffer);
      expect(filePath).toBe(`${testOrgId}/${testContractorId}/${testFileId}-${testFileName}`);
    });

    it('should sanitize file name', async () => {
      const filePath = await service.save(testOrgId, testContractorId, testFileId, 'my file (1).pdf', testBuffer);
      expect(filePath).toContain('my_file__1_.pdf');
    });
  });

  describe('read', () => {
    it('should return buffer for existing file', async () => {
      const filePath = await service.save(testOrgId, testContractorId, testFileId, testFileName, testBuffer);
      const result = await service.read(filePath);
      expect(result).toEqual(testBuffer);
    });

    it('should throw NotFoundException for missing file', async () => {
      await expect(service.read('nonexistent/path.pdf')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should remove existing file', async () => {
      const filePath = await service.save(testOrgId, testContractorId, testFileId, testFileName, testBuffer);
      await service.delete(filePath);

      const fileExists = await service.exists(filePath);
      expect(fileExists).toBe(false);
    });

    it('should not throw for missing file', async () => {
      await expect(service.delete('nonexistent/path.pdf')).resolves.not.toThrow();
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const filePath = await service.save(testOrgId, testContractorId, testFileId, testFileName, testBuffer);
      const result = await service.exists(filePath);
      expect(result).toBe(true);
    });

    it('should return false for missing file', async () => {
      const result = await service.exists('nonexistent/path.pdf');
      expect(result).toBe(false);
    });
  });
});
