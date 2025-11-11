import crypto from 'crypto';

const generateShortCode = (length = 6) => {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
};

export default generateShortCode;
