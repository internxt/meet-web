import { vi } from 'vitest';

vi.stubGlobal('crypto', {
    getRandomValues: vi.fn(),
    subtle: {
        digest: vi.fn(),
        importKey: vi.fn(),
        exportKey: vi.fn(),
        sign: vi.fn(),
        verify: vi.fn(),
        encrypt: vi.fn(),
        decrypt: vi.fn()
    }
});