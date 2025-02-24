import { Fingrprint, FingrprintEvents } from '../src/index';

describe('Fingrprint', () => {
    let consoleLogSpy: jest.SpyInstance;
    const hideConsoleLogs = false;
    let fingrprint: Fingrprint | null = null;

    beforeEach(() => {
        // Create a spy on console.log
        if (hideConsoleLogs) {
            consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        }
    });
  
    afterEach(async () => {
        // Restore the original implementation of console.log
        if (hideConsoleLogs) consoleLogSpy.mockRestore();

        if (fingrprint) {
            fingrprint.removeAllListeners();
            await fingrprint.close();
            fingrprint = null;
        }
    });

    describe('Standalone Mode', () => {
        it('should connect with default configuration', async () => {
            fingrprint = await Fingrprint.initialize();
            const ids = await fingrprint.getIds(1);
            expect(ids).toHaveLength(1);
            expect(typeof ids[0]).toBe('bigint');
        });

        it('should connect with custom configuration', async () => {
            const config = {
                host: 'localhost',
                port: 6379,
                username: 'default',
                password: 'fingrprint',
            };
            fingrprint = await Fingrprint.initialize(config);
            const ids = await fingrprint.getIds(1);
            expect(ids).toHaveLength(1);
            expect(typeof ids[0]).toBe('bigint');
        });

        it('should handle authentication failure', async () => {
            const config = {
                host: 'localhost',
                port: 6379,
                username: 'wrong-user',
                password: 'wrong-password',
            };

            try {
                await Fingrprint.initialize(config);
            } catch (err) {
                expect((err as Error).message).toContain(
                   'Failed to initialize: Invalid username-password pair or user is disabled.'
                );
            }
        });

        it('should handle connection failure', async () => {
            const config = {
                host: 'invalid-host',
                port: 9999,
                username: 'default',
                password: 'fingrprint',
            };

            try {
                await Fingrprint.initialize(config);
            } catch (err) {
                expect((err as Error).message).toMatch(
                    'Failed to initialize: Invalid host.'
                );
            }
        });

        describe('getId function', () => {
            it('should return a bigint id', async () => {
                fingrprint = await Fingrprint.initialize();
                const ids = await fingrprint.getIds(1);
                expect(ids).toHaveLength(1);
                expect(typeof ids[0]).toBe('bigint');
            });
        });
    
        describe('getIds function', () => {
            it('should return an array of bigint', async () => {
                const count = 5;
                fingrprint = await Fingrprint.initialize();
                const ids = await fingrprint.getIds(count);
                expect(ids).toHaveLength(count);
                ids.forEach(id => {
                    expect(typeof id).toBe('bigint');
                });
            });
        });
    });
});
