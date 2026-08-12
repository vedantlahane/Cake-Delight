const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// In-memory OTP store for simulation purposes
// Key: userId, Value: { otp, expiresAt }
const otpStore = {};

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: 1025,
    ignoreTLS: true
});

router.post('/request-otp', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    
    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store with 5 minute expiration
    otpStore[userId] = {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000
    };
    
    try {
        await transporter.sendMail({
            from: '"Cake Delight" <noreply@cakedelight.com>',
            to: `${userId}@example.com`,
            subject: 'Your Cake Delight Login OTP',
            text: `Your login code is: ${otp}. It will expire in 5 minutes.`
        });
        
        res.json({ 
            message: 'OTP generated and sent via email'
        });
    } catch (err) {
        console.error('Failed to send OTP email:', err);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

router.post('/login', (req, res) => {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
        return res.status(400).json({ error: 'userId and otp are required' });
    }
    
    const stored = otpStore[userId];
    if (!stored) {
        return res.status(401).json({ error: 'No OTP requested for this user' });
    }
    
    if (Date.now() > stored.expiresAt) {
        delete otpStore[userId];
        return res.status(401).json({ error: 'OTP has expired' });
    }
    
    if (stored.otp !== otp) {
        return res.status(401).json({ error: 'Invalid OTP' });
    }
    
    // Valid OTP - clear it and generate token
    delete otpStore[userId];
    
    const token = jwt.sign({ userId },
        process.env.JWT_SECRET || 'cakedelight-secret-key-2026',
        { expiresIn: '7d' }
    );
    res.json({ token });
});

module.exports = router;
