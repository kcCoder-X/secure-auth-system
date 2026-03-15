import userModel from '../models/user.model.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await userModel.findOne({
      $or: [{ username }, { email }]
    });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    // Hash the password
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    // Create new user
    const user = await userModel.create({
      username,
      email,
      password: hashedPassword
    });

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: '1d' })

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        username: user.username,
        email: user.email
      },
      token
    })
  } catch (err) {
    console.error('Error in register controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
}
