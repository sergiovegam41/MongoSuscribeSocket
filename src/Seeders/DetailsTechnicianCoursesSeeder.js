
import DetailsTechnicianCourses from '../Models/DetailsTechnicianCourses.js';
import mongoose from 'mongoose';
import { DBNames } from '../db.js';

const seedDetailsTechnicianCourses = async (createdCourses) => {
  try {
    if (!createdCourses || createdCourses.length === 0) {
      console.log('No courses provided to seed DetailsTechnicianCourses');
      return;
    }
    
    const users = await mongoose.connection.db.collection(DBNames.UserCopy).find({ current_role: 'TECNICO'  }).limit(10).toArray();
    
    if (users.length === 0) {
      console.log('No technician users found. Creating sample data with specific IDs.');
      const techniciansIds = [158, 155, 115, 5]; // Agregar ID 158
      const courses = createdCourses.slice(0, 3).map((course, index) => ({
        technical_id: techniciansIds[index] || 158,
        course_catalog_id: course._id
      }));

      await DetailsTechnicianCourses.deleteMany({});
      await DetailsTechnicianCourses.insertMany(courses);
      console.log('DetailsTechnicianCourses seeded with placeholder technical IDs');
      return;
    }

    const courses = createdCourses.slice(0, Math.min(createdCourses.length, users.length)).map((course, index) => ({
      technical_id: users[index].id,
      course_catalog_id: course._id
    }));

    await DetailsTechnicianCourses.deleteMany({});
    await DetailsTechnicianCourses.insertMany(courses);
    console.log('DetailsTechnicianCourses seeded successfully with real technical IDs');

  } catch (error) {
    console.error('Error seeding DetailsTechnicianCourses:', error);
  }
};

export default seedDetailsTechnicianCourses;
