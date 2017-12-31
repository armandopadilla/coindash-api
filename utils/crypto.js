const crypto = require('crypto');

const ENCRYPT_KEY = 'asdf';
const IV_LENGTH = 16;

/**
 * Encrypt specific data.
 *
 * @param data
 * @returns {string}
 */
const encryptData = (data) => {

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', new Buffer(ENCRYPT_KEY), iv);
  let encrypted = cipher.update(data);

  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':'+encrypted.toString('hex');
};


/**
 * Decrypt an encrypted piece of data.
 *
 * @param encryptedData
 */
const decryptData = (encryptedData) => {
  const textParts = encryptedData.split(':');
  const iv = new Buffer(textParts.shift(), 'hex');
  const encryptedText = new Buffer(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer(ENCRYPT_KEY), iv);
  let decypted = decipher.update(encryptedText);

  decypted = Buffer.concat([decypted, decipher.final()]);
  return decrypted.toString();
};

module.exports = {
  encryptData,
  decryptData
};