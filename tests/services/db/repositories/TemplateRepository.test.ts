import { TemplateRepository } from '@services/db/repositories/TemplateRepository';
import type { Template } from '@/types/domain';

const mockGetAllAsync = jest.fn();
const mockGetFirstAsync = jest.fn();
const mockRunAsync = jest.fn();

jest.mock('@services/db/connection', () => ({
  getDatabase: jest.fn(() => ({
    getAllAsync: mockGetAllAsync,
    getFirstAsync: mockGetFirstAsync,
    runAsync: mockRunAsync,
  })),
}));

jest.mock('@services/security/fieldEncryption', () => ({
  encryptField: jest.fn(async (value: string | null) => {
    if (value === null) return null;
    if (value === 'trigger-null') return null;
    return `enc:${value}`;
  }),
  decryptField: jest.fn(async (value: string) => {
    if (value.startsWith('enc:')) return value.slice(4);
    if (value === 'corrupt') throw new Error('Decryption failed');
    return value;
  }),
}));

describe('TemplateRepository', () => {
  let repo: TemplateRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new TemplateRepository();
  });

  const templateRows = [
    {
      id: 'tpl-1',
      name: 'enc:Safety Inspection',
      description: 'enc:Standard safety checklist',
      type: 'project_structure',
      content: 'enc:{"sections":["PPE"]}',
      is_default: 0,
      usage_count: 5,
      created_at: 1000,
      updated_at: 2000,
      is_deleted: 0,
      deleted_at: null,
    },
    {
      id: 'tpl-2',
      name: 'enc:Quality Check',
      description: null,
      type: 'issue_categories',
      content: 'enc:{"categories":["Finishes"]}',
      is_default: 1,
      usage_count: 3,
      created_at: 1500,
      updated_at: 2500,
      is_deleted: 0,
      deleted_at: null,
    },
  ];

  const expectedTemplates: Template[] = [
    {
      id: 'tpl-1',
      name: 'Safety Inspection',
      description: 'Standard safety checklist',
      type: 'project_structure',
      content: '{"sections":["PPE"]}',
      isDefault: 0,
      usageCount: 5,
      createdAt: 1000,
      updatedAt: 2000,
      isDeleted: 0,
      deletedAt: null,
    },
    {
      id: 'tpl-2',
      name: 'Quality Check',
      description: null,
      type: 'issue_categories',
      content: '{"categories":["Finishes"]}',
      isDefault: 1,
      usageCount: 3,
      createdAt: 1500,
      updatedAt: 2500,
      isDeleted: 0,
      deletedAt: null,
    },
  ];

  describe('getAll', () => {
    it('returns all non-deleted templates sorted by name', async () => {
      mockGetAllAsync.mockResolvedValue([templateRows[1], templateRows[0]]);

      const result = await repo.getAll();

      expect(mockGetAllAsync).toHaveBeenCalledWith('SELECT * FROM templates WHERE is_deleted = 0');
      expect(result[0]?.name).toBe('Quality Check');
      expect(result[1]?.name).toBe('Safety Inspection');
    });

    it('returns an empty array when no templates exist', async () => {
      mockGetAllAsync.mockResolvedValue([]);

      const result = await repo.getAll();

      expect(result).toEqual([]);
    });

    it('falls back to raw value when decryption fails', async () => {
      mockGetAllAsync.mockResolvedValue([{ ...templateRows[0], name: 'corrupt' }]);
      const result = await repo.getAll();
      expect(result[0]?.name).toBe('corrupt');
    });

    it('uses empty string when decrypted name is null', async () => {
      mockGetAllAsync.mockResolvedValue([{ ...templateRows[0], name: null, content: null }]);
      const result = await repo.getAll();
      expect(result[0]?.name).toBe('');
      expect(result[0]?.content).toBe('');
    });
  });

  describe('getById', () => {
    it('returns the template when found', async () => {
      mockGetFirstAsync.mockResolvedValue(templateRows[0]);

      const result = await repo.getById('tpl-1');

      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        'SELECT * FROM templates WHERE id = ? AND is_deleted = 0',
        ['tpl-1']
      );
      expect(result).toEqual(expectedTemplates[0]);
    });

    it('returns null when template is not found', async () => {
      mockGetFirstAsync.mockResolvedValue(null);

      const result = await repo.getById('tpl-missing');

      expect(result).toBeNull();
    });
  });

  describe('getByType', () => {
    it('returns templates of the given type sorted by default desc then name', async () => {
      mockGetAllAsync.mockResolvedValue([templateRows[0], templateRows[1]]);

      const result = await repo.getByType('project_structure');

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM templates WHERE type = ? AND is_deleted = 0 ORDER BY is_default DESC',
        ['project_structure']
      );
      expect(result[0]?.isDefault).toBe(1);
      expect(result[1]?.isDefault).toBe(0);
    });

    it('sorts by name when isDefault is equal', async () => {
      mockGetAllAsync.mockResolvedValue([
        { ...templateRows[1], is_default: 0, name: 'enc:Zebra' },
        { ...templateRows[0], is_default: 0, name: 'enc:Alpha' },
      ]);

      const result = await repo.getByType('project_structure');

      expect(result[0]?.name).toBe('Alpha');
      expect(result[1]?.name).toBe('Zebra');
    });

    it('returns an empty array when no templates match the type', async () => {
      mockGetAllAsync.mockResolvedValue([]);

      const result = await repo.getByType('export_format');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('encrypts fields and inserts a new template', async () => {
      const created = {
        id: 'custom-1',
        name: 'enc:My Template',
        description: 'enc:A description',
        type: 'project_structure',
        content: 'enc:{}',
        is_default: 0,
        usage_count: 0,
        created_at: 1000,
        updated_at: 1000,
        is_deleted: 0,
        deleted_at: null,
      };
      mockGetFirstAsync.mockResolvedValue(created);

      const result = await repo.create({
        name: 'My Template',
        description: 'A description',
        type: 'project_structure',
        content: '{}',
      });

      expect(mockRunAsync).toHaveBeenCalled();
      const call = mockRunAsync.mock.calls[0];
      expect(call?.[0]).toContain('INSERT INTO templates');
      const params = call?.[1] as unknown[];
      expect(params[1]).toBe('enc:My Template');
      expect(params[2]).toBe('enc:A description');
      expect(params[4]).toBe('enc:{}');
      expect(result.name).toBe('My Template');
    });

    it('throws when created template cannot be fetched', async () => {
      mockGetFirstAsync.mockResolvedValue(null);

      await expect(
        repo.create({ name: 'X', type: 'project_structure', content: '{}' })
      ).rejects.toThrow('Failed to retrieve created template');
    });

    it('defaults description to null when not provided', async () => {
      mockGetFirstAsync.mockResolvedValue({
        id: 'c-1',
        name: 'enc:X',
        description: null,
        type: 'project_structure',
        content: 'enc:{}',
        is_default: 0,
        usage_count: 0,
        created_at: 1,
        updated_at: 1,
        is_deleted: 0,
        deleted_at: null,
      });

      await repo.create({ name: 'X', type: 'project_structure', content: '{}' });

      const call = mockRunAsync.mock.calls[0];
      const params = call?.[1] as unknown[];
      expect(params[2]).toBeNull();
    });

    it('defaults isDefault to 0 when not provided', async () => {
      mockGetFirstAsync.mockResolvedValue({
        id: 'c-1',
        name: 'enc:X',
        description: null,
        type: 'project_structure',
        content: 'enc:{}',
        is_default: 0,
        usage_count: 0,
        created_at: 1,
        updated_at: 1,
        is_deleted: 0,
        deleted_at: null,
      });

      await repo.create({ name: 'X', type: 'project_structure', content: '{}' });

      const call = mockRunAsync.mock.calls[0];
      const params = call?.[1] as unknown[];
      expect(params[5]).toBe(0);
    });

    it('handles encryptField returning null for name and content', async () => {
      mockGetFirstAsync.mockResolvedValue({
        id: 'c-1',
        name: null,
        description: null,
        type: 'project_structure',
        content: null,
        is_default: 0,
        usage_count: 0,
        created_at: 1,
        updated_at: 1,
        is_deleted: 0,
        deleted_at: null,
      });

      await repo.create({ name: 'trigger-null', type: 'project_structure', content: 'trigger-null' });

      const call = mockRunAsync.mock.calls[0];
      const params = call?.[1] as unknown[];
      expect(params[1]).toBeNull();
      expect(params[4]).toBeNull();
    });
  });

  describe('update', () => {
    it('updates provided fields and preserves others', async () => {
      mockGetFirstAsync
        .mockResolvedValueOnce(templateRows[0])
        .mockResolvedValueOnce({ ...templateRows[0], name: 'enc:Renamed' });

      const result = await repo.update('tpl-1', { name: 'Renamed' });

      expect(mockRunAsync).toHaveBeenCalled();
      const call = mockRunAsync.mock.calls[0];
      expect(call?.[0]).toContain('UPDATE templates SET');
      const params = call?.[1] as unknown[];
      expect(params[0]).toBe('enc:Renamed');
      expect(result.name).toBe('Renamed');
    });

    it('throws when template does not exist', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null);

      await expect(repo.update('missing', { name: 'X' })).rejects.toThrow(
        'Template not found: missing'
      );
    });

    it('throws when updated template cannot be refetched', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(templateRows[0]).mockResolvedValueOnce(null);

      await expect(repo.update('tpl-1', { name: 'X' })).rejects.toThrow(
        'Failed to retrieve updated template'
      );
    });

    it('updates isDefault when provided', async () => {
      mockGetFirstAsync
        .mockResolvedValueOnce(templateRows[0])
        .mockResolvedValueOnce({ ...templateRows[0], is_default: 1 });

      await repo.update('tpl-1', { isDefault: 1 });

      const call = mockRunAsync.mock.calls[0];
      const params = call?.[1] as unknown[];
      expect(params[4]).toBe(1);
    });

    it('updates all fields when provided', async () => {
      mockGetFirstAsync
        .mockResolvedValueOnce(templateRows[0])
        .mockResolvedValueOnce({
          ...templateRows[0],
          name: 'enc:Renamed',
          description: 'enc:New desc',
          type: 'issue_categories',
          content: 'enc:{"items":[]}',
        });

      await repo.update('tpl-1', {
        name: 'Renamed',
        description: 'New desc',
        type: 'issue_categories',
        content: '{"items":[]}',
      });

      const call = mockRunAsync.mock.calls[0];
      const params = call?.[1] as unknown[];
      expect(params[0]).toBe('enc:Renamed');
      expect(params[1]).toBe('enc:New desc');
      expect(params[2]).toBe('issue_categories');
      expect(params[3]).toBe('enc:{"items":[]}');
    });

    it('falls back to existing encrypted values when fields are omitted', async () => {
      mockGetFirstAsync
        .mockResolvedValueOnce(templateRows[0])
        .mockResolvedValueOnce(templateRows[0]);

      await repo.update('tpl-1', { isDefault: 1 });

      const call = mockRunAsync.mock.calls[0];
      const params = call?.[1] as unknown[];
      expect(params[0]).toBe('enc:Safety Inspection'); // existing name re-encrypted
      expect(params[1]).toBe('enc:Standard safety checklist'); // existing description re-encrypted
      expect(params[3]).toBe('enc:{"sections":["PPE"]}'); // existing content re-encrypted
    });
  });

  describe('delete', () => {
    it('soft-deletes a custom template', async () => {
      await repo.delete('custom-abc');

      expect(mockRunAsync).toHaveBeenCalledWith(
        'UPDATE templates SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?',
        expect.arrayContaining(['custom-abc'])
      );
    });

    it('refuses to delete built-in templates (id starts with tmpl-)', async () => {
      await expect(repo.delete('tmpl-default-1')).rejects.toThrow(
        'Cannot delete built-in template'
      );
      expect(mockRunAsync).not.toHaveBeenCalled();
    });
  });
});
