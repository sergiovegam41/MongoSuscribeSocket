
import SocialSecurityEntityCatalog from '../Models/SocialSecurityEntityCatalog.js';
import mongoose from 'mongoose';
import { DBNames } from '../db.js';

const seedSocialSecurityEntityCatalog = async () => {
  try {
    const countries = await mongoose.connection.db.collection(DBNames.countries).find({}).toArray();
    
    if (countries.length === 0) {
      console.log('No countries found. Please seed countries first.');
      return;
    }
    
    const defaultCountry = countries.find(c => c.name === 'Colombia') || countries[0];
    
    const entities = [
      { type: 'ARL', country_id: defaultCountry._id, entity_name: 'ARL Sura' },
      { type: 'EPS', country_id: defaultCountry._id, entity_name: 'EPS Sanitas' },
      { type: 'PENSION', country_id: defaultCountry._id, entity_name: 'Pension Colfondos' },
      { type: 'ARL', country_id: defaultCountry._id, entity_name: 'ARL Positiva' },
      { type: 'EPS', country_id: defaultCountry._id, entity_name: 'EPS Sura' },
      { type: 'PENSION', country_id: defaultCountry._id, entity_name: 'Pension Porvenir' }
    ];

    await SocialSecurityEntityCatalog.deleteMany({});
    await SocialSecurityEntityCatalog.insertMany(entities);
    console.log('SocialSecurityEntityCatalog seeded successfully with dynamic country IDs');
    
  } catch (error) {
    console.error('Error seeding SocialSecurityEntityCatalog:', error);
  }
};

export default seedSocialSecurityEntityCatalog;
