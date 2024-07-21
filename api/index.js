const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const UsersModel = require('./model/user');
const PostModel = require('./model/post');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const app = express();
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads'});
const  fs = require('fs');
const path = require('path');

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

mongoose.connect("mongodb://127.0.0.1:27017/Blog");

app.post('/register', (req, res)=>{
    const {username, password} = req.body;
    UsersModel.create(
        {username, password: bcrypt.hashSync(password, salt)}
    )
    .then(users => res.json(users))
    .catch(err => res.json(err))
})

app.post('/login', (req, res)=>{
    const {username, password} = req.body;
    UsersModel.findOne({username: username})
    .then(users =>{
        const ok = bcrypt.compareSync(password, users.password)
        if(ok){
            res.json("success");
        }
        else{
            res.json("failed");
        }
    })
})

app.post('/create', uploadMiddleware.single('file'), (req, res) => {
    const {title, summary, content, author} = req.body;
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const newPath = path+'.'+ext;
    fs.renameSync(path, newPath);
    PostModel.create(
        {title, summary, content, cover: newPath,author}
    )
    .then(users => res.json("posted successfully"))
    .catch(err => res.json(err))
});

app.get('/post', async(req, res)=>{
    const posts = await PostModel.find().sort({createdAt: -1});
    res.json(posts);
});

app.get('/specific', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.json({ message: 'ID is required' });
        }
        const post = await PostModel.findById(id);
        if (post) {
            res.json(post);
        } else {
            res.json({ message: 'Post not found' });
        }
    } catch (error) {
        console.error('Error retrieving post:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});

app.put('/post', uploadMiddleware.single('files'), async (req, res) => {
    const { title, summary, content, author, id } = req.body;

    try {
        const post = await PostModel.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        let newPath = post.cover;
        if (req.file) {
            const { originalname, path } = req.file;
            const parts = originalname.split('.');
            const ext = parts[parts.length - 1];
            newPath = `${path}.${ext}`;
            fs.renameSync(path, newPath);
        }

        await post.updateOne({
            title,
            summary,
            content,
            cover: newPath,
            author
        });

        res.json({ message: 'Post updated successfully', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}); 


app.listen(3001, ()=>{
    console.log("server is running");
})
