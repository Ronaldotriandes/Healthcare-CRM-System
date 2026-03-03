import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
    let strategy: JwtStrategy;
    let authService: jest.Mocked<AuthService>;

    const mockUser = {
        id: '1',
        username: 'testuser',
        password: 'hashedpassword',
        role: 'USER',
        employee: {
            id: '1',
            fullname: 'Test User'
        }
    };

    beforeEach(async () => {
        const mockAuthService = {
            validateUserById: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JwtStrategy,
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
            ],
        }).compile();

        strategy = module.get<JwtStrategy>(JwtStrategy);
        authService = module.get(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(strategy).toBeDefined();
    });

    describe('validate', () => {
        it('should return user when user exists', async () => {
            const payload = { sub: '1', username: 'testuser' };
            authService.validateUserById.mockResolvedValue(mockUser);

            const result = await strategy.validate(payload);

            expect(result).toEqual(mockUser);
            expect(authService.validateUserById).toHaveBeenCalledWith(payload.sub);
        });

        it('should throw UnauthorizedException when user does not exist', async () => {
            const payload = { sub: 'nonexistent', username: 'testuser' };
            authService.validateUserById.mockResolvedValue(null);

            await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
            expect(authService.validateUserById).toHaveBeenCalledWith(payload.sub);
        });

        it('should throw UnauthorizedException when validateUserById throws error', async () => {
            const payload = { sub: '1', username: 'testuser' };
            authService.validateUserById.mockRejectedValue(new Error('Database error'));

            await expect(strategy.validate(payload)).rejects.toThrow();
            expect(authService.validateUserById).toHaveBeenCalledWith(payload.sub);
        });
    });
});