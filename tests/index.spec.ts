import Fingrprint from '../src/index';

describe('Fingrprint', () => {
    let fingrprint: Fingrprint | null = null;

    afterEach(async () => {
        if (fingrprint) await fingrprint.close();
    });

    it('should use default values and connect to redis server', async () => {
        fingrprint = new Fingrprint();
        const ids = await fingrprint.getIds(1);
        expect(ids).toHaveLength(1);
        expect(typeof ids[0]).toBe('bigint'); // Jest's `toBe`
    });

    it('should use custom values and connect to redis server', async () => {
        const config = {
            host: 'localhost',
            port: 6389,
            username: 'default',
            password: 'fingrprint'
        };
        fingrprint = new Fingrprint(config);
        const ids = await fingrprint.getIds(1);
        expect(fingrprint.toString()).toBe(
            `Host: ${config.host}, Port: ${config.port}, Username: ${config.username}, Password: ${config.password}`
        );
        expect(ids).toHaveLength(1);
        expect(typeof ids[0]).toBe('bigint');
    });

    it('should fail authentication to redis server', async () => {
        try {
            fingrprint = new Fingrprint({
                host: 'localhost',
                port: 6389,
                username: 'test-user',
                password: 'bad-password',
                reconnectStrategy: () => false, // No retries
            });
            await fingrprint.getIds(1);
        } catch (err) {
            expect((err as Error).message).toContain(
                'WRONGPASS invalid username-password pair or user is disabled.'
            );
        }
    });

    it('should fail to connect to redis server', async () => {
        try {
            fingrprint = new Fingrprint({
                host: 'local', // Invalid host
                port: 8888,    // Invalid port
                reconnectStrategy: () => false, // No retries
            });
            await fingrprint.getIds(1);
        } catch (err) {
            expect((err as Error).message).toEqual(expect.stringMatching(/(getaddrinfo ENOTFOUND local|getaddrinfo EAI_AGAIN local)/)); // Use Jest's string matching
        }
    });

    describe('getId function', () => {
        it('should return a bigint id', async () => {
            fingrprint = new Fingrprint({
                host: 'localhost',
                port: 6389,
            });
            const id = await fingrprint.getId();
            expect(typeof id).toBe('bigint');
        });
    });

    describe('getIds function', () => {
        it('should return an array of bigint', async () => {
            const count = 5;
            fingrprint = new Fingrprint({
                host: 'localhost',
                port: 6389,
            });
            const ids = await fingrprint.getIds(count);
            expect(ids).toHaveLength(count);
            ids.forEach(id => {
                expect(typeof id).toBe('bigint');
            });
        });

        it('should handle redis connection errors', async () => {
            fingrprint = new Fingrprint({
                host: 'localhost',
                port: 6389,
            });
            try {
                await fingrprint.getIds(2);
            } catch (err) {
                expect((err as Error).message).toBe('redis connection issue');
            }
        });
    });
});
