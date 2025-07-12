
import CourseCatalog from '../Models/CourseCatalog.js';
import mongoose from 'mongoose';
import { DBNames } from '../db.js';

const seedCourseCatalog = async () => {
  try {
    const professions = await mongoose.connection.db.collection(DBNames.professions).find({}).toArray();
    
    if (professions.length === 0) {
      console.log('No professions found. Please seed professions first.');
      return [];
    }
    
    const courseMapping = [
      { course_name: 'Aires acondicionados', profession_name: 'tecnico_en_refrigeracion' },
      { course_name: 'Limpieza', profession_name: 'trabajadoresas_domesticosas' },
      { course_name: 'Electronico', profession_name: 'electricista' }
    ];
    
    const courses = courseMapping.map(course => {
      const profession = professions.find(p => 
        p.name === course.profession_name || 
        p.slug_name === course.profession_name.toLowerCase()
      );
      
      if (!profession) {
        console.warn(`Profession ${course.profession_name} not found, using first available profession`);
        return {
          course_name: course.course_name,
          profession_id: professions[0]._id,
          course_label: course.course_name.replace(/\s+/g, '_').toLowerCase()
        };
      }
      
      return {
        course_name: course.course_name,
        profession_id: profession._id,
        course_label: course.course_name.replace(/\s+/g, '_').toLowerCase()
      };
    });

    await CourseCatalog.deleteMany({});
    const createdCourses = await CourseCatalog.insertMany(courses);
    console.log('CourseCatalog seeded successfully with dynamic profession IDs');
    return createdCourses;
    
  } catch (error) {
    console.error('Error seeding CourseCatalog:', error);
    return [];
  }
};

export default seedCourseCatalog;
