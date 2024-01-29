import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    imageUrl:{
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Blogs = mongoose.model('Blogs', blogSchema);

export default Blogs;
