
import seedCourseCatalog from './CourseCatalogSeeder.js';
import seedDetailsTechnicianCourses from './DetailsTechnicianCoursesSeeder.js';
import seedSocialSecurityDetailsTechnician from './SocialSecurityDetailsTechnicianSeeder.js';
import seedSocialSecurityEntityCatalog from './SocialSecurityEntityCatalogSeeder.js';
import { connectMongoose } from '../db.js';

const runSeeders = async () => {
  try {
    await connectMongoose();
    const createdCourses = await seedCourseCatalog();
    await seedDetailsTechnicianCourses(createdCourses);
    await seedSocialSecurityEntityCatalog();
    await seedSocialSecurityDetailsTechnician();
    console.log('All seeders executed successfully');
    process.exit()
  } catch (error) {
    console.error('Error running seeders:', error);
  } finally {
    
  }
};

runSeeders();
