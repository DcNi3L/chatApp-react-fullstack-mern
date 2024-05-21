import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { jwtSecret, bcryptSalt } from '../config/index.js';

const UserController = {
    async login(req, res) {
        const { username, password } = req.body;
        try {
            const foundUser = await User.findOne({ username });
            if (foundUser) {
                const passOk = bcrypt.compareSync(password, foundUser.password);
                if (passOk) {
                    const token = jwt.sign(
                        { userId: foundUser._id, username },
                        jwtSecret,
                        { expiresIn: '1h' }
                    );
                    res.cookie('token', token, { sameSite: 'none', secure: true }).json({
                        id: foundUser._id,
                    });
                } else {
                    res.status(401).json('Invalid username or password');
                }
            } else {
                res.status(404).json('User not found');
            }
        } catch (error) {
            res.status(500).json(error.message);
        }
    },

    async logout(req, res) {
        res.cookie('token', '', { sameSite: 'none', secure: true }).json('ok');
    },

    async register(req, res) {
        const { username, password } = req.body;
        try {
            const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
            const createdUser = await User.create({
                username,
                password: hashedPassword,
            });

            const token = jwt.sign(
                { userId: createdUser._id, username },
                jwtSecret,
                { expiresIn: '1h' }
            );
            res.cookie('token', token, { sameSite: 'none', secure: true }).status(201).json({
                _id: createdUser._id,
            });
        } catch (error) {
            res.status(500).json(error.message);
        }
    },

    async getProfile(req, res) {
        const token = req.cookies?.token;
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) {
                    res.clearCookie('token').status(401).json('Invalid token');
                } else {
                    res.json(userData);
                }
            });
        } else {
            res.status(401).json('no token');
        }
    },

    async getAllUsers(req, res) {
        try {
            const users = await User.find({}, { _id: 1, username: 1 });
            res.json(users);
        } catch (error) {
            res.status(500).json(error.message);
        }
    },

    async updateProfile(req, res) {
        const token = req.cookies?.token;
        const { uId, name, password } = req.body;
      
        if (token && ((name || password) !== '')) {
          jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) {
              return res.status(401).json('Invalid token');
            }
      
            try {
              const userId = userData.userId;
              const userToUpdate = {};
      
              if (name) {
                userToUpdate.username = name;
              }
      
              if (password) {
                const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
                userToUpdate.password = hashedPassword;
              }
      
              console.log(name, password);
      
              if (Object.keys(userToUpdate).length === 0) {
                return res.status(400).json('No data provided for update');
              }
      
              const updatedUser = await User.findByIdAndUpdate(
                userId,
                userToUpdate,
                { new: true }
              );
      
              
              const newToken = jwt.sign(
                { userId: updatedUser._id, username: updatedUser.username },
                jwtSecret,
                { expiresIn: '1h' }
              );
      
              
              res.cookie('token', newToken, { sameSite: 'none', secure: true });
              res.json('Profile updated successfully');
            } catch (error) {
              res.status(500).json(error.message);
            }
          });
        } else {
          res.status(401).json('No token provided');
        }
      },

      async deleteUser(req, res) {
        const token = req.cookies?.token;
        if (token) {
            jwt.verify(token, jwtSecret, {}, async (err, userData) => {
                if (err) {
                    return res.status(401).json('Invalid token');
                }
    
                try {
                    const userId = userData.userId;
                    res.cookie('token', '', { sameSite: 'none', secure: true }).json('User deleted successfully');
                    await User.findByIdAndDelete(userId);
                    
                } catch (error) {
                    res.status(500).json(error.message);
                }
            });
        } else {
            res.status(401).json('No token provided');
        }
    },    
};

export default UserController;
