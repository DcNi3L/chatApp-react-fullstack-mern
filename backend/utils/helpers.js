import jwt from 'jsonwebtoken';
import { jwtSecret } from "../config/index.js";

async function getUserDataFromReq(req) {
    return new Promise((resolve, reject) => {
        const token = req.cookies?.token;
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) reject(err);
                resolve(userData);
            });
        } else {
            reject('no token');
        }
    });
}

export { getUserDataFromReq };
