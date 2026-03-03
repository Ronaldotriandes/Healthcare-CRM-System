import { jest } from '@jest/globals';

beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.NODE_ENV = 'test';
});

afterAll(() => {
});

global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};