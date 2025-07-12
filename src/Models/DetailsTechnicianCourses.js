
import mongoose from 'mongoose';
import {DBNames} from "../db.js";

const DetailsTechnicianCoursesSchema = new mongoose.Schema({
  technical_id: {
    type: mongoose.Schema.Types.Number,
    ref: DBNames.UserCopy,
    required: true
  },
  course_catalog_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: DBNames.course_catalog,
    required: true
  }
}, {
  timestamps: true
});

DetailsTechnicianCoursesSchema.index({ technical_id: 1 });
DetailsTechnicianCoursesSchema.index({ course_catalog_id: 1 });
DetailsTechnicianCoursesSchema.index({ technical_id: 1, course_catalog_id: 1 }, { unique: true });

export default mongoose.model(DBNames.details_technician_courses, DetailsTechnicianCoursesSchema);
