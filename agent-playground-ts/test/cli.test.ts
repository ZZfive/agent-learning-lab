import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCliMessage } from '../src/cli.ts';

test('buildCliMessage joins positional arguments into one agent message', () => {
  const message = buildCliMessage(['summarize', '"hello world"']);

  assert.equal(message, 'summarize "hello world"'); // 断言消息等于 'summarize "hello world"'，严格相等/===
});

test('buildCliMessage trims surrounding whitespace from joined arguments', () => {
  const message = buildCliMessage(['  hello', 'world  ']);

  assert.equal(message, 'hello world'); // 断言消息等于 'hello world'
});

test('buildCliMessage throws when no message arguments are provided', () => {
  assert.throws(() => buildCliMessage([]), /Please provide a message/);
});
