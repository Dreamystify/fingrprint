import Fingrprint from '../src/index';
import chai, { assert, expect } from 'chai';
import 'mocha';

chai.use(require('chai-as-promised'));

describe('Fingrprint', () => {

    it('should use default values and connect to redis server', async () => {
        const fingrprint: any = new Fingrprint();
        const ids = await fingrprint.getIds(1);
        expect(ids).to.have.lengthOf(1);
        assert.typeOf(ids[0], 'BigInt');
        await fingrprint.close();
    });

    it('should use custom values and connect to redis server', async () => {
        const config = {
            host: `localhost`,
            port: 6389,
            username: `default`,
            password: `fingrprint`
        };
        const fingrprint: any = new Fingrprint(config);
        const ids = await fingrprint.getIds(1);
        expect(fingrprint.toString()).to.be.equal(`Host: ${config.host}, Port: ${config.port}, Username: ${config.username}, Password: ${config.port}`)
        expect(ids).to.have.lengthOf(1);
        assert.typeOf(ids[0], 'BigInt');
        await fingrprint.close();
    });

    it('should fail authentication to redis server', async () => {
        try {
            const fingrprint: any = new Fingrprint({
                host: `localhost`,
                port: 6389,
                username: `test-user`,
                password: `bad-password`
            });
            const ids = await fingrprint.getIds(1);
            await fingrprint.close();
        } catch(e) {
            if (e instanceof Error) {
                expect(e.message).to.equal('WRONGPASS invalid username-password pair or user is disabled.');
            }
        }
    });

    it('should fail to connect to redis server', async () => {
        try {
            const fingrprint: any = new Fingrprint({
                host: `local`,
                port: 8888,
            });
            const ids = await fingrprint.getIds(1);
        } catch(e) {
            if (e instanceof Error) {
                expect(e.message).to.be.oneOf(['getaddrinfo ENOTFOUND local', 'getaddrinfo EAI_AGAIN local']);
            }
        }
    });
});

describe('getId function', () => {

    it('should return a bigint id', async () => {
        const fingrprint: any = new Fingrprint({
            host: `localhost`,
            port: 6389,
        });
        const id = await fingrprint.getId();
        assert.typeOf(id, 'BigInt');
        await fingrprint.close();
    });
});

describe('getIds function', () => {

    it('should return an array of bigint', async () => {
        const fingrprint: any = new Fingrprint({
            host: `localhost`,
            port: 6389,
        });
        const count = 5;
        const ids = await fingrprint.getIds(count);
        expect(ids).to.have.lengthOf(count);
        for (const id of ids) {
            assert.typeOf(id, 'BigInt');
        }
        await fingrprint.close();
    });
});
