import mongoose from 'mongoose';

// Helper to query product by MongoDB _id OR slug
export const getProductQuery = (idParam: string) => {
  if (!idParam) return { _id: null };
  if (mongoose.isValidObjectId(idParam)) {
    return { $or: [{ _id: new mongoose.Types.ObjectId(idParam) }, { slug: idParam }] };
  }
  return { slug: idParam };
};
