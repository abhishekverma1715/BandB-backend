import mongoose from 'mongoose';

export const buildQueryByIdOrField = (idParam: string, fallbackField: string = 'slug') => {
  if (!idParam) return { _id: null };
  if (mongoose.isValidObjectId(idParam)) {
    return { $or: [{ _id: new mongoose.Types.ObjectId(idParam) }, { [fallbackField]: idParam }] };
  }
  return { [fallbackField]: idParam };
};
