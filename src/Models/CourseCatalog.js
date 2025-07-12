
import mongoose from 'mongoose';
import {DBNames} from "../db.js";

const CourseCatalogSchema = new mongoose.Schema({
  course_name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  course_label: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  profession_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: DBNames.professions,
    required: true
  }
}, {
  timestamps: true
});

CourseCatalogSchema.index({ profession_id: 1 });
CourseCatalogSchema.index({ course_name: 1, profession_id: 1 }, { unique: true });

export default mongoose.model(DBNames.course_catalog, CourseCatalogSchema);
