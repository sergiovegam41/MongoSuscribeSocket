
import mongoose from 'mongoose';
import {DBNames} from "../db.js";

const SocialSecurityDetailsTechnicianSchema = new mongoose.Schema({
  technical_id: {
    type: mongoose.Schema.Types.Number,
    ref: DBNames.UserCopy,
    required: true
  },
  social_security_entity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: DBNames.social_security_entity_catalog,
    required: true
  },
  profession_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: DBNames.professions,
    required: true
  }
}, {
  timestamps: true
});

SocialSecurityDetailsTechnicianSchema.index({ technical_id: 1 });
SocialSecurityDetailsTechnicianSchema.index({ profession_id: 1 });
SocialSecurityDetailsTechnicianSchema.index({ social_security_entity_id: 1 });
SocialSecurityDetailsTechnicianSchema.index({ technical_id: 1, social_security_entity_id: 1 }, { unique: true });

export default mongoose.model(DBNames.social_security_details_technician, SocialSecurityDetailsTechnicianSchema);
