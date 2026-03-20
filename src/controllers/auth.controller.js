import userModel from '../models/user.model.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import sessionModel from '../models/session.model.js';

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
    
    const refreshToken = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: '7d' })

    const session = await sessionModel.create({
      userId: user._id,
      refreshTokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    })

    // Generate JWT token
    const accessToken = jwt.sign({
      id: user._id,
      sessionId: session._id
    }, config.JWT_SECRET, { expiresIn: '15m' })


    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        username: user.username,
        email: user.email
      },
      accessToken
    })
  } catch (err) {
    console.error('Error in register controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    if (hashedPassword !== user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const refreshToken = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: '7d' });

    const session = await sessionModel.create({
      userId: user._id,
      refreshTokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    const accessToken = jwt.sign({
      id: user._id,
      sessionId: session._id
    }, config.JWT_SECRET, { expiresIn: '15m' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      message: 'User logged in successfully',
      user: {
        username: user.username,
        email: user.email
      },
      accessToken
    });
  } catch (err) {
    console.error('Error in login controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getMe(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = jwt.verify(token, config.JWT_SECRET);
    // console.log('Decoded token:', decoded);
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(201).json({
      message : "user fetched successfully",
      user: {
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Error in getMe controller:', err);
    res.status(500).json({ message: 'Server error' });
}
}

export async function refreshToken(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const session = await sessionModel.findOne({
      userId: decoded.id,
      refreshTokenHash,
      revoked: false
    });

    if (!session) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    const accessToken = jwt.sign({
      id: decoded.id,
      sessionId: session._id
    }, config.JWT_SECRET, {
      expiresIn: "15m"
    })

    const newRefreshToken = jwt.sign({
      id: decoded.id
    }, config.JWT_SECRET, {
      expiresIn: "7d"
    })

    const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    session.refreshTokenHash = newRefreshTokenHash;
    await session.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      message: "Access token refreshed successfully",
      accessToken
    })
  } catch (err) {
    console.error('Error in refreshToken controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function logout(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const session = await sessionModel.findOneAndUpdate(
      { refreshTokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex') },
      { revoked: true }
    );
    if(!session) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    session.revoked = true;
    await session.save();

    res.clearCookie('refreshToken');

    res.status(200).json({ message: 'User logged out successfully' });
  } catch (err) {
    console.error('Error in logout controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function logoutAll(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

    await sessionModel.updateMany(
      { userId: decoded.id },
      { revoked: true }
    );
    res.status(200).json({ message: "logged out successfully from all devices" });
  } catch (err) {
    console.error('Error in logoutAll controller:', err);
    res.status(500).json({ message: 'Server error' });
  }
}