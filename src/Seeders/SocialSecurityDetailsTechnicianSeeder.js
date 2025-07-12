
import SocialSecurityDetailsTechnician from '../Models/SocialSecurityDetailsTechnician.js';
import SocialSecurityEntityCatalog from '../Models/SocialSecurityEntityCatalog.js';
import mongoose from 'mongoose';
import { DBNames } from '../db.js';

const seedSocialSecurityDetailsTechnician = async () => {
  try {
    const professions = await mongoose.connection.db.collection(DBNames.professions).find({}).toArray();
    const socialSecurityEntities = await SocialSecurityEntityCatalog.find({}).lean();
    const users = await mongoose.connection.db.collection(DBNames.UserCopy).find({ current_role: 'TECNICO' }).limit(5).toArray();
    
    if (professions.length === 0 || socialSecurityEntities.length === 0) {
      console.log('Missing professions or social security entities. Please seed them first.');
      return;
    }
    
    const details = [];
    const maxRecords = Math.min(3, socialSecurityEntities.length);
    
    const techniciansIds = [158, 155, 115]; // IDs específicos para testing
    for (let i = 0; i < maxRecords; i++) {
      details.push({
        technical_id: users[i] ? users[i].id : techniciansIds[i],
        social_security_entity_id: socialSecurityEntities[i]._id,
        profession_id: professions[i % professions.length]._id
      });
    }

    await SocialSecurityDetailsTechnician.deleteMany({});
    await SocialSecurityDetailsTechnician.insertMany(details);
    console.log('SocialSecurityDetailsTechnician seeded successfully with dynamic IDs');
    
  } catch (error) {
    console.error('Error seeding SocialSecurityDetailsTechnician:', error);
  }
};

export default seedSocialSecurityDetailsTechnician;
