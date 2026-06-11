require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Component = require('./src/models/Component');
const RentalTransaction = require('./src/models/RentalTransaction');
const Lecture = require('./src/models/Lecture');
const WalletTransaction = require('./src/models/WalletTransaction');
const Lab = require('./src/models/Lab');

const MOCK_COMPONENTS = [
  { name: 'Arduino Uno R3', category: 'Microcontrollers', availableQuantity: 12, totalQuantity: 30, description: 'Microcontroller board based on the ATmega328P', imageUrl: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=200' },
  { name: 'Breadboard', category: 'Components', availableQuantity: 5, totalQuantity: 50, description: 'Solderless breadboard for prototyping', imageUrl: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&q=80&w=200' },
  { name: 'Jumper Wires (M-M)', category: 'Cables', availableQuantity: 450, totalQuantity: 500, description: 'Male to Male jumper wires', imageUrl: 'https://plus.unsplash.com/premium_photo-1678116120530-5840bd49870b?auto=format&fit=crop&q=80&w=200' },
  { name: 'Raspberry Pi 4', category: 'Microcontrollers', availableQuantity: 0, totalQuantity: 10, description: 'Single board computer with 4GB RAM', imageUrl: 'https://images.unsplash.com/photo-1601462904263-228cb61925bf?auto=format&fit=crop&q=80&w=200' },
  { name: 'Ultrasonic Sensor', category: 'Sensors', availableQuantity: 15, totalQuantity: 20, description: 'HC-SR04 distance measuring sensor', imageUrl: 'https://images.unsplash.com/photo-1596733430284-f74370c8151b?auto=format&fit=crop&q=80&w=200' },
  { name: 'Servo Motor', category: 'Motors', availableQuantity: 8, totalQuantity: 15, description: 'SG90 Micro Servo Motor', imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=200' },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/labmanagement');
    console.log('Connected to DB');

    // Clear existing
    await User.deleteMany({});
    await Component.deleteMany({});
    await RentalTransaction.deleteMany({});
    await Lecture.deleteMany({});
    await WalletTransaction.deleteMany({});
    await Lab.deleteMany({});

    // Create Admin, Teacher and Student
    const admin = new User({ name: 'Admin User', email: 'admin@lab.com', password: 'password123', role: 'admin' });
    const teacher = new User({ name: 'Teacher User', email: 'teacher@lab.com', password: 'password123', role: 'teacher' });
    const student = new User({ name: 'John Doe', email: 'student@lab.com', password: 'password123', role: 'student' });
    
    await admin.save();
    await teacher.save();
    await student.save();

    // Insert Components
    const components = await Component.insertMany(MOCK_COMPONENTS);

    // Create Mock Lectures
    const arduino = components.find(c => c.name === 'Arduino Uno R3');
    const led = components.find(c => c.name === 'Jumper Wires (M-M)'); // Just using as an example
    const breadboard = components.find(c => c.name === 'Breadboard');

    const lecture1 = new Lecture({
      title: 'Introduction to Arduino',
      description: 'Learn the basics of Arduino programming and circuit design.',
      videoUrl: 'https://www.youtube.com/watch?v=nL34zDTPkcs',
      requiredEquipment: [arduino?._id, led?._id].filter(Boolean),
      prerequisites: [],
      language: 'English',
      difficulty: 'Beginner',
      department: 'Electronics'
    });
    await lecture1.save();

    const lecture2 = new Lecture({
      title: 'Advanced Sensor Integration',
      description: 'Connect ultrasonic sensors to Arduino to measure distance.',
      videoUrl: 'https://www.youtube.com/watch?v=Z3XIDhXqAFA',
      requiredEquipment: [arduino?._id, breadboard?._id, components.find(c => c.name === 'Ultrasonic Sensor')?._id].filter(Boolean),
      prerequisites: [lecture1._id],
      language: 'English',
      difficulty: 'Intermediate',
      department: 'Electronics'
    });
    await lecture2.save();

    // Create DA candidate student who has completed all lectures
    const daCandidate = new User({
      name: 'DA Candidate',
      email: 'da_candidate@lab.com',
      password: 'password123',
      role: 'student',
      completedLectures: [lecture1._id, lecture2._id]
    });
    await daCandidate.save();

    // Seed some initial wallet logs
    const initialLog = new WalletTransaction({
      userId: student._id,
      updatedBy: admin._id,
      amount: 500,
      type: 'topup',
      previousBalance: 0,
      newBalance: 500,
      description: 'Initial balance top-up by administrator'
    });
    await initialLog.save();

    // Create a physical Lab mapping
    const physicsLab = new Lab({
      name: 'General Physics & Electronics Lab',
      description: 'Main laboratory for elementary circuits and sensor integrations.',
      manager: teacher._id,
      assistants: [daCandidate._id],
      components: [arduino?._id, breadboard?._id].filter(Boolean)
    });
    await physicsLab.save();

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding DB:', error);
    process.exit(1);
  }
};

seedDB();
