import { ClipboardService } from './clipboard.service';
import { ClipboardRepository } from './clipboard.repository';
import type { SharedClipboard } from '@contractor-os/shared';

const STORED: SharedClipboard = {
  content: 'https://claude.ai/public/artifacts/455e139f',
  updatedAt: '2026-07-16T12:00:00.000Z',
};

describe('ClipboardService', () => {
  let service: ClipboardService;
  let repo: jest.Mocked<ClipboardRepository>;

  beforeEach(() => {
    repo = {
      get: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<ClipboardRepository>;

    service = new ClipboardService(repo);
  });

  describe('get', () => {
    it('returns the stored clipboard', async () => {
      repo.get.mockResolvedValue(STORED);

      const result = await service.get();

      expect(result).toEqual(STORED);
    });

    it('returns an empty clipboard when no row exists', async () => {
      repo.get.mockResolvedValue(null);

      const result = await service.get();

      expect(result.content).toBe('');
      expect(result.updatedAt).toBe(new Date(0).toISOString());
    });
  });

  describe('update', () => {
    it('persists the new content and returns the updated clipboard', async () => {
      const updated: SharedClipboard = {
        content: 'a new note',
        updatedAt: '2026-07-16T13:00:00.000Z',
      };
      repo.update.mockResolvedValue(updated);

      const result = await service.update('a new note');

      expect(repo.update).toHaveBeenCalledWith('a new note');
      expect(result).toEqual(updated);
    });
  });
});
