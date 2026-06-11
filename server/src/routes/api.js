const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Component = require('../models/Component');
const RentalTransaction = require('../models/RentalTransaction');
const Lecture = require('../models/Lecture');
const User = require('../models/User');
const LabCompletionRequest = require('../models/LabCompletionRequest');
const WalletTransaction = require('../models/WalletTransaction');
const Lab = require('../models/Lab');
const { protect, restrictTo } = require('../middleware/auth');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'labmgmt_super_secret_key_2024_change_in_production', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Central helper to update wallet balance and log the transaction
const adjustWalletAndLog = async ({ userId, updatedBy, amount, type, description }) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  const previousBalance = user.walletBalance;
  user.walletBalance = Number((user.walletBalance + amount).toFixed(2));
  await user.save();
  
  const log = new WalletTransaction({
    userId,
    updatedBy: updatedBy || null,
    amount,
    type,
    previousBalance,
    newBalance: user.walletBalance,
    description
  });
  await log.save();
  return user;
};

// Login Route (Unprotected)
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken(user._id);
    const userObj = user.toObject();
    delete userObj.password;
    res.json({ token, user: userObj });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Signup Route (Unprotected)
router.post('/auth/signup', async (req, res) => {
  try {
    const { name, email, password, studentId } = req.body;
    
    // Check if email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use' });
    }

    // Create a new user (defaults to student role)
    const user = new User({
      name,
      email,
      password,
      studentId,
      role: 'student'
    });

    await user.save();

    const token = signToken(user._id);
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({ token, user: userObj });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ALL ROUTES BELOW THIS ARE PROTECTED ---

// Get all components (Student Catalog)
router.get('/components', protect, async (req, res) => {
  try {
    const components = await Component.find();
    res.json(components);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new component (Admin Upload)
router.post('/components', protect, restrictTo('admin'), async (req, res) => {
  try {
    const component = new Component(req.body);
    await component.save();
    res.status(201).json(component);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Checkout items (Cart)
router.post('/checkout', protect, async (req, res) => {
  try {
    const { userId, items } = req.body; // items: [{ componentId, quantity, hours }]
    
    // Check wallet balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.walletBalance < 0) {
      return res.status(400).json({ error: 'Checkout blocked. You have a negative wallet balance due to unpaid fines. Please top up your wallet.' });
    }

    const transactions = [];

    // Verify all items have enough quantity first
    for (const item of items) {
      const component = await Component.findById(item.componentId);
      if (!component || component.availableQuantity < item.quantity) {
        return res.status(400).json({ error: `Not enough quantity for ${component?.name || 'unknown item'}` });
      }
    }

    // Process transactions
    for (const item of items) {
      const component = await Component.findById(item.componentId);
      
      const dueTime = new Date();
      dueTime.setHours(dueTime.getHours() + item.hours);

      const transaction = new RentalTransaction({
        userId,
        componentId: item.componentId,
        quantityRented: item.quantity,
        dueTime,
        status: 'pending'
      });
      await transaction.save();

      component.availableQuantity -= item.quantity;
      await component.save();
      
      transactions.push(transaction);
    }

    res.status(201).json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user specific rentals
router.get('/rentals/user/:userId', protect, async (req, res) => {
  try {
    const rentals = await RentalTransaction.find({ userId: req.params.userId })
      .populate('componentId', 'name imageUrl')
      .sort({ createdAt: -1 });
    res.json(rentals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active and pending rentals (Admin Dashboard / Teacher)
router.get('/rentals/active', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const rentals = await RentalTransaction.find({ status: { $in: ['active', 'overdue', 'pending'] } })
      .populate('userId', 'name email')
      .populate('componentId', 'name');
    res.json(rentals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark item returned (Admin Dashboard / Teacher)
router.post('/return/:transactionId', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { customFine } = req.body;
    
    const transaction = await RentalTransaction.findById(transactionId);
    if (!transaction || transaction.status === 'returned') {
      return res.status(400).json({ error: 'Invalid or already returned transaction' });
    }

    const now = new Date();
    let fine = 0;
    
    if (customFine !== undefined) {
      fine = Number(customFine);
    } else if (now > transaction.dueTime) {
      // Calculate fine: ₹10 per hour late per quantity
      const hoursLate = Math.ceil((now - transaction.dueTime) / (1000 * 60 * 60));
      fine = hoursLate * 10 * transaction.quantityRented;
    }

    transaction.status = 'returned';
    transaction.returnTime = now;
    transaction.fineAmount = fine;
    transaction.finePaid = fine > 0;
    await transaction.save();

    if (fine > 0) {
      await adjustWalletAndLog({
        userId: transaction.userId,
        updatedBy: req.user._id,
        amount: -fine,
        type: 'fine',
        description: `Late return fine for transaction ${transactionId}`
      });
    }

    const component = await Component.findById(transaction.componentId);
    if (component) {
      component.availableQuantity += transaction.quantityRented;
      await component.save();
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve rental request (Admin / Teacher)
router.post('/rentals/:id/approve', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const transaction = await RentalTransaction.findById(req.params.id);
    if (!transaction || transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Invalid transaction' });
    }
    transaction.status = 'active';
    await transaction.save();
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject rental request (Admin / Teacher)
router.post('/rentals/:id/reject', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const transaction = await RentalTransaction.findById(req.params.id);
    if (!transaction || transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Invalid transaction' });
    }
    transaction.status = 'rejected';
    await transaction.save();

    const component = await Component.findById(transaction.componentId);
    if (component) {
      component.availableQuantity += transaction.quantityRented;
      await component.save();
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Impose manual fine on student (Admin / Teacher)
router.post('/rentals/:id/fine', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const { fineAmount } = req.body;
    if (fineAmount === undefined || isNaN(Number(fineAmount)) || Number(fineAmount) < 0) {
      return res.status(400).json({ error: 'Please provide a valid fine amount' });
    }

    const transaction = await RentalTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Rental transaction not found' });
    }

    const student = await User.findById(transaction.userId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const fine = Number(fineAmount);
    const updatedStudent = await adjustWalletAndLog({
      userId: transaction.userId,
      updatedBy: req.user._id,
      amount: -fine,
      type: 'fine',
      description: `Manual fine on rental transaction ${req.params.id}`
    });

    transaction.fineAmount += fine;
    transaction.finePaid = true;
    await transaction.save();

    res.json({ transaction, walletBalance: updatedStudent.walletBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get component renters
router.get('/components/:id/renters', protect, async (req, res) => {
  try {
    const rentals = await RentalTransaction.find({ 
      componentId: req.params.id, 
      status: { $in: ['active', 'overdue', 'pending'] } 
    }).populate('userId', 'name email');
    res.json(rentals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update rental transaction due date
router.put('/rentals/:id/due-date', protect, async (req, res) => {
  try {
    const { dueTime } = req.body;
    if (!dueTime) {
      return res.status(400).json({ error: 'Due time is required' });
    }
    const rental = await RentalTransaction.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    const isManager = ['admin', 'teacher', 'da'].includes(req.user.role);
    const isOwner = rental.userId.toString() === req.user._id.toString();

    if (!isManager && !isOwner) {
      return res.status(403).json({ error: 'You do not have permission to modify this rental' });
    }

    if (!isManager && rental.status !== 'pending') {
      return res.status(400).json({ error: 'Students can only edit the due date before approval (when pending)' });
    }

    rental.dueTime = new Date(dueTime);

    // Re-evaluate overdue status on save if active
    if (rental.status === 'active' && new Date() > rental.dueTime) {
      rental.status = 'overdue';
    } else if (rental.status === 'overdue' && new Date() <= rental.dueTime) {
      rental.status = 'active';
    }

    await rental.save();
    res.json(rental);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get lectures
router.get('/lectures', protect, async (req, res) => {
  try {
    const lectures = await Lecture.find()
      .populate('requiredEquipment')
      .populate('prerequisites');
    res.json(lectures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create lecture
router.post('/lectures', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const lecture = new Lecture(req.body);
    await lecture.save();
    res.status(201).json(lecture);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete lecture
router.delete('/lectures/:id', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    await Lecture.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update lecture (Admin/Teacher only)
router.put('/lectures/:id', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const lecture = await Lecture.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }
    res.json(lecture);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-fetch lecture details from video URL
router.get('/lectures/metadata', protect, async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const axios = require('axios');
    let title = '';
    let description = '';

    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    if (isYouTube) {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const oembedRes = await axios.get(oembedUrl);
        if (oembedRes.data && oembedRes.data.title) {
          title = oembedRes.data.title;
        }
      } catch (e) {
        console.error('YouTube oEmbed failed, falling back to HTML parse', e.message);
      }
    }

    // Parse page HTML for description (and title if not already found)
    try {
      const response = await axios.get(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
        timeout: 5000 
      });
      const html = response.data;
      
      if (!title) {
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) {
          title = titleMatch[1].trim().replace(/\s+/g, ' ');
        }
      }

      const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) || 
                        html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i);
      if (descMatch) {
        description = descMatch[1].trim().replace(/\s+/g, ' ');
      }
    } catch (e) {
      console.error('HTML scrape failed', e.message);
    }

    // Clean up youtube suffix in title if present
    if (title && isYouTube) {
      title = title.replace(/\s*-\s*YouTube$/i, '');
    }

    res.json({ title, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark lecture as completed for a student (verifier only)
router.post('/lectures/:id/complete', protect, restrictTo('admin', 'teacher', 'da'), async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required' });
    }
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const lectureId = req.params.id;
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    if (!student.completedLectures.includes(lectureId)) {
      student.completedLectures.push(lectureId);
      await student.save();
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all student and DA users for monitoring/DA assignment
router.get('/users/students', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    let query = { role: { $in: ['student', 'da'] } };
    if (req.user.role === 'admin') {
      query = {}; // Admin can see all users
    }
    const students = await User.find(query).select('-password');
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get eligible verifiers (all users, for peer requests)
router.get('/users/verifiers', protect, async (req, res) => {
  try {
    const verifiers = await User.find({}).select('name role');
    res.json(verifiers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change user role (Admin only)
router.put('/users/:id/role', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'teacher', 'da', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If changing to DA, check if they have completed all lectures
    if (role === 'da') {
      const totalLectures = await Lecture.countDocuments();
      if (userToUpdate.completedLectures.length < totalLectures) {
        return res.status(400).json({ error: 'User has not completed all lectures and cannot be assigned as DA.' });
      }
    }

    userToUpdate.role = role;
    await userToUpdate.save();
    res.json(userToUpdate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign DA role to a student (Must have completed all lectures)
router.post('/users/:id/assign-da', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get total number of lectures
    const totalLectures = await Lecture.countDocuments();
    
    // Check if student has completed all lectures
    if (student.completedLectures.length < totalLectures) {
      return res.status(400).json({ error: 'Student has not completed all lectures and cannot be assigned as DA.' });
    }

    student.role = 'da';
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Demote DA back to student
router.post('/users/:id/demote-student', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = 'student';
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile (including walletBalance)
router.get('/users/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle canUpdateWallet permission for a user (Admin only)
router.put('/users/:id/wallet-permission', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { canUpdateWallet } = req.body;
    if (typeof canUpdateWallet !== 'boolean') {
      return res.status(400).json({ error: 'canUpdateWallet must be a boolean' });
    }
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ error: 'User not found' });
    }
    userToUpdate.canUpdateWallet = canUpdateWallet;
    await userToUpdate.save();
    res.json(userToUpdate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update any user's wallet balance (Restricted to admin / users with canUpdateWallet permission)
router.post('/users/wallet/update-balance', protect, async (req, res) => {
  try {
    const hasPermission = req.user.role === 'admin' || req.user.canUpdateWallet === true;
    if (!hasPermission) {
      return res.status(403).json({ error: 'You do not have permission to update wallet balances' });
    }

    const { userId, amount, type, description } = req.body;
    if (!userId || amount === undefined || isNaN(Number(amount)) || !type || !description) {
      return res.status(400).json({ error: 'Please provide target userId, numeric amount, type, and description' });
    }

    if (!['topup', 'fine', 'refund', 'adjustment'].includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    const updatedUser = await adjustWalletAndLog({
      userId,
      updatedBy: req.user._id,
      amount: Number(amount),
      type,
      description
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user's wallet transaction logs
router.get('/users/wallet/my-transactions', protect, async (req, res) => {
  try {
    const logs = await WalletTransaction.find({ userId: req.user._id })
      .populate('updatedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all wallet transaction logs (Restricted to admin / users with canUpdateWallet permission)
router.get('/users/wallet/all-transactions', protect, async (req, res) => {
  try {
    const hasPermission = req.user.role === 'admin' || req.user.canUpdateWallet === true;
    if (!hasPermission) {
      return res.status(403).json({ error: 'You do not have permission to view all wallet transactions' });
    }
    const logs = await WalletTransaction.find({})
      .populate('userId', 'name email role')
      .populate('updatedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Top up user's wallet (Restricted to authorized operators)
router.post('/users/wallet/topup', protect, async (req, res) => {
  try {
    const hasPermission = req.user.role === 'admin' || req.user.canUpdateWallet === true;
    if (!hasPermission) {
      return res.status(403).json({ error: 'You do not have permission to update wallet balances' });
    }
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Please provide a valid top-up amount' });
    }
    const user = await adjustWalletAndLog({
      userId: req.user._id,
      updatedBy: req.user._id,
      amount: Number(amount),
      type: 'topup',
      description: 'Self top-up (Authorized Operator)'
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit a lab completion request
router.post('/lab-requests', protect, async (req, res) => {
  try {
    const { lectureId, requestedVerifierId, requestedVerifierIds } = req.body;
    const studentId = req.user._id;

    // Check if lecture exists
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    // Check if student already completed it
    if (req.user.completedLectures.includes(lectureId)) {
      return res.status(400).json({ error: 'You have already completed this lab.' });
    }

    // Check if there is already a pending request
    const existingRequest = await LabCompletionRequest.findOne({ studentId, lectureId, status: 'pending' });
    if (existingRequest) {
      return res.status(400).json({ error: 'A pending request already exists for this lab.' });
    }

    // Check prerequisites
    if (lecture.prerequisites && lecture.prerequisites.length > 0) {
      const completedIds = req.user.completedLectures.map(id => id.toString());
      const hasPrereqs = lecture.prerequisites.every(prereqId => completedIds.includes(prereqId.toString()));
      if (!hasPrereqs) {
        return res.status(400).json({ error: 'You must complete the prerequisite lectures first.' });
      }
    }

    const requestedVerifierIdsArray = Array.isArray(requestedVerifierIds) 
      ? requestedVerifierIds 
      : (requestedVerifierId ? [requestedVerifierId] : []);

    const request = new LabCompletionRequest({
      studentId,
      lectureId,
      requestedVerifierIds: requestedVerifierIdsArray,
      status: 'pending',
      daStatus: 'pending',
      teacherStatus: 'pending',
      adminStatus: 'pending'
    });

    await request.save();
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending lab verification requests for verifier queue
router.get('/lab-requests/pending', protect, async (req, res) => {
  try {
    let query = { status: 'pending' };
    
    if (req.user.role === 'da') {
      query.daStatus = 'pending';
    } else if (req.user.role === 'teacher') {
      // Teachers see requests pending teacher approval, or pending DA approval
      query.$or = [
        { daStatus: 'approved', teacherStatus: 'pending' },
        { daStatus: 'pending' } // fallback
      ];
    } else if (req.user.role === 'admin') {
      // Admins see all pending requests
    } else if (req.user.role === 'student') {
      // Standard students can only see requests specifically assigned to them
      query.requestedVerifierIds = req.user._id;
    }

    const requests = await LabCompletionRequest.find(query)
      .populate('studentId', 'name email studentId')
      .populate('lectureId', 'title')
      .populate('actionedBy', 'name role')
      .populate('daActionedBy', 'name role')
      .populate('teacherActionedBy', 'name role')
      .populate('adminActionedBy', 'name role')
      .populate('requestedVerifierIds', 'name role')
      .sort({ createdAt: 1 });
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all lab verification requests (for all verifiers/history)
router.get('/lab-requests', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      // Standard students can only see requests assigned to them or actioned by them
      query.$or = [
        { requestedVerifierIds: req.user._id },
        { actionedBy: req.user._id }
      ];
    }
    const requests = await LabCompletionRequest.find(query)
      .populate('studentId', 'name email studentId')
      .populate('lectureId', 'title')
      .populate('actionedBy', 'name role')
      .populate('daActionedBy', 'name role')
      .populate('teacherActionedBy', 'name role')
      .populate('adminActionedBy', 'name role')
      .populate('requestedVerifierIds', 'name role')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current student's requests
router.get('/lab-requests/my-requests', protect, async (req, res) => {
  try {
    const requests = await LabCompletionRequest.find({ studentId: req.user._id })
      .populate('actionedBy', 'name role')
      .populate('daActionedBy', 'name role')
      .populate('teacherActionedBy', 'name role')
      .populate('adminActionedBy', 'name role')
      .populate('requestedVerifierIds', 'name role')
      .sort({ updatedAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve/Reject lab completion request
router.post('/lab-requests/:id/action', protect, async (req, res) => {
  try {
    const { action, rejectionReason } = req.body; // 'approve' or 'reject'
    const request = await LabCompletionRequest.findById(req.params.id);
    if (!request || request.status !== 'pending') {
      return res.status(400).json({ error: 'Invalid or already processed request' });
    }

    const userRole = req.user.role;
    const isAssignedVerifier = request.requestedVerifierIds && request.requestedVerifierIds.some(id => id.toString() === req.user._id.toString());
    const isManager = ['admin', 'teacher', 'da'].includes(userRole);

    if (!isManager && !isAssignedVerifier) {
      return res.status(403).json({ error: 'You do not have permission to verify this request' });
    }

    if (action === 'approve') {
      let stageApproved = false;

      // 1. DA Stage
      if (request.daStatus === 'pending') {
        if (userRole === 'da' || userRole === 'teacher' || userRole === 'admin' || isAssignedVerifier) {
          request.daStatus = 'approved';
          request.daActionedBy = req.user._id;
          stageApproved = true;
        } else {
          return res.status(403).json({ error: 'You do not have permission to approve the DA stage' });
        }
      }
      // 2. Teacher Stage
      else if (request.teacherStatus === 'pending') {
        if (userRole === 'teacher' || userRole === 'admin') {
          request.teacherStatus = 'approved';
          request.teacherActionedBy = req.user._id;
          stageApproved = true;
        } else {
          return res.status(403).json({ error: 'You do not have permission to approve the Teacher stage' });
        }
      }
      // 3. Admin Stage
      else if (request.adminStatus === 'pending') {
        if (userRole === 'admin') {
          request.adminStatus = 'approved';
          request.adminActionedBy = req.user._id;
          request.status = 'approved';
          request.actionedBy = req.user._id;
          stageApproved = true;

          // Update student's completedLectures
          const student = await User.findById(request.studentId);
          if (student && !student.completedLectures.includes(request.lectureId)) {
            student.completedLectures.push(request.lectureId);
            await student.save();
          }
        } else {
          return res.status(403).json({ error: 'You do not have permission to approve the Admin stage' });
        }
      }

      if (!stageApproved) {
        return res.status(400).json({ error: 'No pending stage matches your role / credentials' });
      }

      await request.save();
    } else if (action === 'reject') {
      // Rejection by any level rejects the entire request
      if (userRole === 'da') {
        request.daStatus = 'rejected';
        request.daActionedBy = req.user._id;
      } else if (userRole === 'teacher') {
        request.teacherStatus = 'rejected';
        request.teacherActionedBy = req.user._id;
      } else if (userRole === 'admin') {
        request.adminStatus = 'rejected';
        request.adminActionedBy = req.user._id;
      }

      request.status = 'rejected';
      request.actionedBy = req.user._id;
      request.rejectionReason = rejectionReason || 'Reverification required. Please perform the lab once again.';
      await request.save();
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- LABS ROUTES ---

// Create Lab (Admins and Teachers only)
router.post('/labs', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const { name, description, components, manager, assistants } = req.body;
    if (!name || !manager) {
      return res.status(400).json({ error: 'Lab name and manager are required' });
    }
    const lab = new Lab({
      name,
      description,
      components: components || [],
      manager,
      assistants: assistants || []
    });
    await lab.save();
    res.status(201).json(lab);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all Labs (All authenticated users)
router.get('/labs', protect, async (req, res) => {
  try {
    const labs = await Lab.find()
      .populate('components', 'name category totalQuantity availableQuantity imageUrl')
      .populate('manager', 'name email role')
      .populate('assistants', 'name email role');
    res.json(labs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single Lab details (All authenticated users)
router.get('/labs/:id', protect, async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id)
      .populate('components', 'name category totalQuantity availableQuantity imageUrl')
      .populate('manager', 'name email role')
      .populate('assistants', 'name email role');
    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }
    res.json(lab);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Lab (Admins, Teachers, or Lab's manager only)
router.put('/labs/:id', protect, async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    const isManager = req.user.role === 'admin' || 
                      req.user.role === 'teacher' || 
                      lab.manager.toString() === req.user._id.toString();

    if (!isManager) {
      return res.status(403).json({ error: 'You do not have permission to modify this lab' });
    }

    const { name, description, components, manager, assistants } = req.body;
    if (name) lab.name = name;
    if (description !== undefined) lab.description = description;
    if (components) lab.components = components;
    if (manager) {
      // Only admin/teacher can change manager
      if (req.user.role === 'admin' || req.user.role === 'teacher') {
        lab.manager = manager;
      }
    }
    if (assistants) lab.assistants = assistants;

    await lab.save();
    res.json(lab);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Lab (Admins and Teachers only)
router.delete('/labs/:id', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const lab = await Lab.findByIdAndDelete(req.params.id);
    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }
    res.json({ success: true, message: 'Lab deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
