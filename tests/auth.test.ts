import assert from 'node:assert';
import {
  authenticateUser,
  signSessionToken,
  verifySessionToken,
  STORE_USERS,
} from '../src/lib/auth';

async function runTests() {
  console.log('Running auth.test.ts...');

  // 1. Verify standard users exist
  assert.strictEqual(STORE_USERS.length, 2, 'Should have 2 standard users: owner and kasir');
  const ownerUser = STORE_USERS.find((u) => u.username === 'owner');
  const kasirUser = STORE_USERS.find((u) => u.username === 'kasir');
  assert.ok(ownerUser, 'Owner user must exist');
  assert.ok(kasirUser, 'Kasir user must exist');
  assert.strictEqual(ownerUser.role, 'owner');
  assert.strictEqual(kasirUser.role, 'kasir');

  // 2. Authentication by PIN
  const authKasirPin = authenticateUser('kasir', '1234');
  assert.ok(authKasirPin, 'Kasir should authenticate via PIN 1234');
  assert.strictEqual(authKasirPin.username, 'kasir');
  assert.strictEqual(authKasirPin.role, 'kasir');

  const authOwnerPin = authenticateUser('owner', '8888');
  assert.ok(authOwnerPin, 'Owner should authenticate via PIN 8888');
  assert.strictEqual(authOwnerPin.username, 'owner');
  assert.strictEqual(authOwnerPin.role, 'owner');

  // 3. Authentication by Password
  const authKasirPass = authenticateUser('kasir', 'kasir123');
  assert.ok(authKasirPass, 'Kasir should authenticate via password');

  const authOwnerPass = authenticateUser('owner', 'rangers123');
  assert.ok(authOwnerPass, 'Owner should authenticate via password');

  // 4. Invalid authentication
  const authWrong = authenticateUser('kasir', 'wrongpin');
  assert.strictEqual(authWrong, null, 'Wrong PIN must return null');

  const authNotFound = authenticateUser('unknown', '1234');
  assert.strictEqual(authNotFound, null, 'Unknown username must return null');

  // 5. Token signing and verification
  const token = await signSessionToken({
    username: 'kasir',
    name: 'Kasir Rangers',
    role: 'kasir',
  });
  assert.ok(token && typeof token === 'string', 'Token must be a valid string');
  assert.ok(token.includes('.'), 'Token must contain a payload and signature separated by dot');

  const verified = await verifySessionToken(token);
  assert.ok(verified, 'Verified session should not be null');
  assert.strictEqual(verified.username, 'kasir');
  assert.strictEqual(verified.role, 'kasir');
  assert.ok(verified.exp > Math.floor(Date.now() / 1000), 'Expiration should be in future');

  // 6. Tampered token rejection
  const tamperedToken = token.slice(0, -4) + 'abcd';
  const tamperedResult = await verifySessionToken(tamperedToken);
  assert.strictEqual(tamperedResult, null, 'Tampered token must return null');

  // 7. Malformed token rejection
  const malformed = await verifySessionToken('invalid-token-without-dot');
  assert.strictEqual(malformed, null, 'Malformed token must return null');

  console.log('✅ auth.test.ts passed!');
}

runTests().catch((err) => {
  console.error('❌ auth.test.ts failed:', err);
  process.exit(1);
});
