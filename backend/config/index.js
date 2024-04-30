import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

export { jwtSecret, bcryptSalt };
