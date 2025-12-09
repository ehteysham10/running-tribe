import jwt from 'jsonwebtoken';

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

const googleAuthCallback = (req, res) => {
  try {
    const user = req.user;
    const token = signToken(user);

    return res.json({
      message: 'Google Authentication Successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Google auth callback error' });
  }
};

export default { googleAuthCallback };
