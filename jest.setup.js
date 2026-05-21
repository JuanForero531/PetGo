require('@testing-library/jest-dom');

// Simple fetch polyfill for Node test environment to satisfy firebase/auth imports
if (typeof global.fetch !== 'function') {
	global.fetch = (..._args) => Promise.resolve({ ok: true, status: 200, json: async () => ({}), text: async () => '' });
}

// Minimal Response/Request/Headers shims used by some firebase/node builds
if (typeof global.Response === 'undefined') {
	global.Response = class {
		constructor(body = null, init = {}) {
			this.body = body;
			this.status = init.status || 200;
			this.ok = this.status >= 200 && this.status < 300;
		}
		async json() {
			if (typeof this.body === 'string') return JSON.parse(this.body);
			return this.body;
		}
		async text() {
			if (typeof this.body === 'string') return this.body;
			return JSON.stringify(this.body);
		}
	};
}
if (typeof global.Headers === 'undefined') {
	global.Headers = class {
		constructor(init = {}) { this.map = init; }
		get(k) { return this.map[k.toLowerCase()]; }
	};
}
if (typeof global.Request === 'undefined') {
	global.Request = class { constructor(url, opts = {}) { this.url = url; this.method = opts.method || 'GET'; this.headers = opts.headers || {}; } };
}
