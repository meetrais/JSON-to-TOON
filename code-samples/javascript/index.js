import { encode, decode } from '@toon-format/toon';
import assert from 'assert';

/**
 * @typedef {object} User
 * @property {number} id
 * @property {string} name
 * @property {string} role
 */

/**
 * @typedef {object} Data
 * @property {User[]} users
 */

function main() {
  /** @type {Data} */
  const sampleData = {
    users: [
      { id: 1, name: 'Alice', role: 'admin' },
      { id: 2, name: 'Bob', role: 'user' },
    ],
  };

  // Encode to TOON
  const toonString = encode(sampleData);
  console.log('--- TOON Format ---');
  console.log(toonString);

  // Decode back to JavaScript object
  const decodedData = decode(toonString);
  console.log('\n--- Decoded Data ---');
  console.log(JSON.stringify(decodedData, null, 2));

  // Verification
  assert.deepStrictEqual(sampleData, decodedData, 'Verification failed: Original and decoded data do not match.');
  console.log('\nVerification successful: Original and decoded data match.');
}

main();
