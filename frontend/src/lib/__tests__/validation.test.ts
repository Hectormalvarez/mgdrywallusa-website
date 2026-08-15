import {
  validateName,
  validatePhone,
  validateEmail,
  validateProjectTier,
  validateFiles,
  validateForm,
  formatPhone,
} from '@/lib/validation';
import { MAX_FILES, MAX_FILE_SIZE_BYTES, MAX_TOTAL_SIZE_BYTES } from '@/lib/leads';

function createFile(name: string, sizeBytes: number, type = 'image/png'): File {
  return new File([new ArrayBuffer(sizeBytes)], name, { type });
}

describe('validateName', () => {
  it('returns undefined for a valid name', () => {
    expect(validateName('Jane Doe')).toBeUndefined();
  });

  it('returns error for empty string', () => {
    expect(validateName('')).toBe('Name is required');
  });

  it('returns error for whitespace-only string', () => {
    expect(validateName('   ')).toBe('Name is required');
  });
});

describe('validatePhone', () => {
  it('returns undefined for 10-digit US number', () => {
    expect(validatePhone('555-123-4567')).toBeUndefined();
  });

  it('returns undefined for 7-digit local number', () => {
    expect(validatePhone('555-1234')).toBeUndefined();
  });

  it('returns undefined for +1 prefixed number', () => {
    expect(validatePhone('+1-555-123-4567')).toBeUndefined();
  });

  it('returns undefined for parentheses format', () => {
    expect(validatePhone('(555) 123-4567')).toBeUndefined();
  });

  it('returns error for empty string', () => {
    expect(validatePhone('')).toBe('Phone is required');
  });

  it('returns error for non-numeric garbage', () => {
    expect(validatePhone('abc')).toBe(
      'Enter a valid US phone number (e.g. 555-123-4567)'
    );
  });
});

describe('formatPhone', () => {
  it('formats a 10-digit unformatted number', () => {
    expect(formatPhone('5551234567')).toBe('555-123-4567');
  });

  it('formats a 7-digit number', () => {
    expect(formatPhone('5551234')).toBe('555-1234');
  });

  it('formats a 3-digit number without a trailing dash', () => {
    expect(formatPhone('555')).toBe('555');
  });

  it('formats a 6-digit number as 3-3', () => {
    expect(formatPhone('555123')).toBe('555-123');
  });

  it('preserves existing dashes', () => {
    expect(formatPhone('555-123-4567')).toBe('555-123-4567');
  });

  it('strips non-digit characters except leading +', () => {
    expect(formatPhone('(555) 123-4567')).toBe('555-123-4567');
  });

  it('formats +1 prefixed number', () => {
    expect(formatPhone('+15551234567')).toBe('+1-555-123-4567');
  });

  it('returns empty string for empty input', () => {
    expect(formatPhone('')).toBe('');
  });

  it('truncates to 10 digits max (excluding country code)', () => {
    expect(formatPhone('555123456789')).toBe('555-123-4567');
  });
});

describe('validateEmail', () => {
  it('returns undefined for valid email', () => {
    expect(validateEmail('jane@example.com')).toBeUndefined();
  });

  it('returns error for empty string', () => {
    expect(validateEmail('')).toBe('Email is required');
  });

  it('returns error for missing @', () => {
    expect(validateEmail('janeexample.com')).toBe('Enter a valid email address');
  });

  it('returns error for missing domain', () => {
    expect(validateEmail('jane@')).toBe('Enter a valid email address');
  });
});

describe('validateProjectTier', () => {
  it('returns undefined for valid tiers', () => {
    expect(validateProjectTier('repair')).toBeUndefined();
    expect(validateProjectTier('single_room')).toBeUndefined();
    expect(validateProjectTier('adu')).toBeUndefined();
  });

  it('returns error for empty string', () => {
    expect(validateProjectTier('')).toBe('Project tier is required');
  });

  it('returns error for invalid tier', () => {
    expect(validateProjectTier('kitchen')).toBe('Invalid project tier');
  });
});

describe('validateFiles', () => {
  it('accepts valid files within limits', () => {
    const files = [
      createFile('a.png', 1024, 'image/png'),
      createFile('b.jpg', 2048, 'image/jpeg'),
    ];
    const result = validateFiles(files);
    expect(result.errors).toHaveLength(0);
    expect(result.accepted).toEqual(files);
  });

  it('rejects when file count exceeds MAX_FILES', () => {
    const files = Array.from({ length: MAX_FILES + 1 }, (_, i) =>
      createFile(`f${i}.png`, 100, 'image/png')
    );
    const result = validateFiles(files);
    expect(result.errors).toEqual(
      expect.arrayContaining([`No more than ${MAX_FILES} files allowed`])
    );
    expect(result.accepted).toHaveLength(0);
  });

  it('rejects individual files exceeding MAX_FILE_SIZE_BYTES', () => {
    const files = [createFile('huge.png', MAX_FILE_SIZE_BYTES + 1, 'image/png')];
    const result = validateFiles(files);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('exceeds the 10 MB limit')])
    );
    expect(result.accepted).toHaveLength(0);
  });

  it('rejects when aggregate size exceeds MAX_TOTAL_SIZE_BYTES', () => {
    const half = Math.floor(MAX_TOTAL_SIZE_BYTES / 2) + 1;
    const files = [
      createFile('a.png', half, 'image/png'),
      createFile('b.png', half, 'image/png'),
    ];
    const result = validateFiles(files);
    expect(result.errors).toEqual(
      expect.arrayContaining(['Total upload size exceeds 10 MB'])
    );
    expect(result.accepted).toHaveLength(0);
  });

  it('rejects disallowed MIME types', () => {
    const files = [createFile('doc.pdf', 100, 'application/pdf')];
    const result = validateFiles(files);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('not an accepted file type')])
    );
    expect(result.accepted).toHaveLength(0);
  });

  it('accepts image/webp', () => {
    const files = [createFile('photo.webp', 100, 'image/webp')];
    const result = validateFiles(files);
    expect(result.errors).toHaveLength(0);
    expect(result.accepted).toEqual(files);
  });

  it('returns empty accepted when errors exist', () => {
    const files = [createFile('bad.bmp', 100, 'image/bmp')];
    const result = validateFiles(files);
    expect(result.accepted).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('validateForm', () => {
  const valid = {
    name: 'Jane Doe',
    phone: '555-123-4567',
    email: 'jane@example.com',
    projectTier: 'repair',
    files: [] as File[],
    fileValidationError: false,
  };

  it('returns no errors for valid input', () => {
    expect(validateForm(valid)).toEqual({});
  });

  it('returns name error when empty', () => {
    expect(validateForm({ ...valid, name: '' })).toHaveProperty('name');
  });

  it('returns phone error when invalid', () => {
    expect(validateForm({ ...valid, phone: 'abc' })).toHaveProperty('phone');
  });

  it('returns email error when invalid', () => {
    expect(validateForm({ ...valid, email: 'bad' })).toHaveProperty('email');
  });

  it('returns projectTier error when empty', () => {
    expect(validateForm({ ...valid, projectTier: '' })).toHaveProperty('projectTier');
  });

  it('returns files error when fileValidationError is true', () => {
    expect(validateForm({ ...valid, fileValidationError: true })).toHaveProperty('files');
  });
});
