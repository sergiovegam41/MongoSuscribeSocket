import mongoose from 'mongoose';
import {DBNames} from "../db.js";

const SocialSecurityEntityCatalogSchema = new mongoose.Schema({
  type:{
    type: String,
    enum: ['ARL', 'EPS', 'PENSION'],
    required: true
  },
  country_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: DBNames.countries,
    required: true
  },
  entity_name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  }
}, {
  timestamps: true
});

SocialSecurityEntityCatalogSchema.index({ country_id: 1 });
SocialSecurityEntityCatalogSchema.index({ type: 1 });
SocialSecurityEntityCatalogSchema.index({ entity_name: 1, country_id: 1 }, { unique: true });

export default mongoose.model(DBNames.social_security_entity_catalog, SocialSecurityEntityCatalogSchema);