const index = require('../function/index');

describe('index', () => {
	it('should be success', async () => {
		await index.handler('1');
		expect(true).toBe(true);
	});
});