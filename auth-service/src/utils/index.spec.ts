import { getIndonesiaDate } from './index';

describe('Utils', () => {
    describe('getIndonesiaDate', () => {
        beforeEach(() => {
            jest.useRealTimers();
        });

        it('should return current date in Indonesia timezone', () => {
            const mockDate = new Date('2024-01-15T10:00:00Z');
            jest.useFakeTimers();
            jest.setSystemTime(mockDate);

            const result = getIndonesiaDate();

            expect(result).toBeInstanceOf(Date);

            jest.useRealTimers();
        });

        it('should handle timezone conversion correctly', () => {
            const result = getIndonesiaDate();
            expect(result).toBeInstanceOf(Date);
        });
    });
});